using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using AkilliMikroERP.Data;
using AkilliMikroERP.Models;
using Google.Apis.Auth.OAuth2;
using System.Net.Http.Headers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AkilliMikroERP.Services
{
    public class GeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly ApplicationDbContext _db;
        private readonly GoogleCredential _googleCredential;

        // Rate limiting için
        private static DateTime _lastRequestTime = DateTime.MinValue;
        private static readonly SemaphoreSlim _semaphore = new SemaphoreSlim(10, 10);
        private static int _requestCount = 0;
        private static DateTime _requestCountResetTime = DateTime.UtcNow;


        // Limitler (Google'ın güncel gemini-1.5-flash limitlerine göre güncellendi)
        private readonly TimeSpan _minimumDelay = TimeSpan.FromMilliseconds(60); // 1000 RPM için ~60ms
        private readonly int _maxRequestsPerMinute = 950; // Google limitinin altında kalmak için
        private readonly int _maxRequestsPerHour = 50000; // Genellikle daha yüksek olur, Google dokümantasyonuna bakın
        private readonly int _maxRetries = 3; // Maksimum 3 deneme

        public GeminiService(IHttpClientFactory httpClientFactory, ApplicationDbContext db)
        {
            _httpClient = httpClientFactory.CreateClient();
            _db = db;
            _httpClient.Timeout = TimeSpan.FromSeconds(60); 
        }

        public async Task<string> AskGemini(string prompt, string model = "gemini-1.5-flash", string type = "generic", Guid? relatedId = null)
        {
            await _semaphore.WaitAsync();

            try
            {
                return await AskGeminiInternal(prompt, model, type, relatedId);
            }
            finally
            {
                _semaphore.Release();
            }
        }

        private async Task<string> AskGeminiInternal(string prompt, string model, string type, Guid? relatedId)
        {
            // Rate limiting kontrolü
            await EnforceRateLimit();

            var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new Exception("GEMINI_API_KEY ortam değişkeni bulunamadı!");
            }

            var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.7,
                    maxOutputTokens = 1024,
                    topP = 0.8,
                    topK = 40
                }
            };

            var jsonContent = new StringContent(JsonConvert.SerializeObject(requestBody), Encoding.UTF8, "application/json");

            string outputText = "";
            string status = "başarılı";
            string responseString = "";

            // Retry mekanizması
            for (int attempt = 1; attempt <= _maxRetries; attempt++)
            {
                try
                {
                    Console.WriteLine($"Gemini API çağrısı - Deneme {attempt}/{_maxRetries}");

                    _httpClient.DefaultRequestHeaders.Clear();

                    var response = await _httpClient.PostAsync(endpoint, jsonContent);
                    responseString = await response.Content.ReadAsStringAsync();

                    Console.WriteLine($"HTTP Status Code: {response.StatusCode}");
                    Console.WriteLine($"API RESPONSE: {responseString}");

                    if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                    {
                        // 429 hatası - Rate limit aşımı
                        var retryAfter = GetRetryAfterDelay(responseString);
                        Console.WriteLine($"Rate limit aşıldı. {retryAfter.TotalSeconds} saniye bekleniyor...");

                        if (attempt < _maxRetries)
                        {
                            await Task.Delay(retryAfter);
                            continue; // Tekrar dene
                        }
                        else
                        {
                            status = "quota aşımı";
                            outputText = $"API rate limit aşıldı. {retryAfter.TotalSeconds} saniye sonra tekrar deneyin.";
                            break;
                        }
                    }
                    else if (!response.IsSuccessStatusCode)
                    {
                        status = "hata";
                        outputText = $"API Error: {response.StatusCode}";
                        break;
                    }
                    else
                    {
                        // Başarılı yanıt
                        try
                        {
                            var json = JObject.Parse(responseString);
                            outputText = json["candidates"]?[0]?["content"]?["parts"]?[0]?["text"]?.ToString() ?? "";

                            if (string.IsNullOrWhiteSpace(outputText))
                            {
                                status = "boş cevap";
                                outputText = "API'den boş yanıt alındı.";
                            }
                            else
                            {
                                Console.WriteLine($"Başarılı yanıt alındı: {outputText.Substring(0, Math.Min(100, outputText.Length))}...");
                            }
                        }
                        catch (Exception parseEx)
                        {
                            status = "parse hatası";
                            outputText = "API yanıtı parse edilemedi.";
                            Console.WriteLine($"Parse hatası: {parseEx.Message}");
                        }
                        break; // Başarılı, döngüyü kır
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Deneme {attempt} başarısız: {ex.Message}");

                    if (attempt < _maxRetries)
                    {
                        await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt))); // Exponential backoff
                    }
                    else
                    {
                        status = "hata";
                        outputText = $"API çağrısı başarısız: {ex.Message}";
                        responseString = ex.Message;
                    }
                }
            }

            // Request sayısını güncelle
            UpdateRequestCount();

            // AI isteğini kaydet
            var log = new AiLog
            {
                Model = model,
                Type = type,
                RelatedId = relatedId,
                InputData = JsonConvert.SerializeObject(requestBody),
                OutputData = string.IsNullOrWhiteSpace(outputText) ? responseString : outputText,
                // OutputData = outputText,
                Status = status
            };

            _db.AiLogs.Add(log);
            await _db.SaveChangesAsync();

            return outputText;
        }

        private async Task EnforceRateLimit()
        {
            var now = DateTime.UtcNow;

            // Son istekten bu yana minimum süre geçmişse devam et
            var timeSinceLastRequest = now - _lastRequestTime;
            if (timeSinceLastRequest < _minimumDelay)
            {
                var delayTime = _minimumDelay - timeSinceLastRequest;
                Console.WriteLine($"Rate limit koruması: {delayTime.TotalSeconds} saniye bekleniyor...");
                await Task.Delay(delayTime);
            }

            // Request sayısını kontrol et
            if (now - _requestCountResetTime > TimeSpan.FromMinutes(1))
            {
                _requestCount = 0;
                _requestCountResetTime = now;
            }

            if (_requestCount >= _maxRequestsPerMinute)
            {
                var waitTime = TimeSpan.FromMinutes(1) - (now - _requestCountResetTime);
                Console.WriteLine($"Dakika başına limit aşıldı. {waitTime.TotalSeconds} saniye bekleniyor...");
                await Task.Delay(waitTime);
                _requestCount = 0;
                _requestCountResetTime = DateTime.UtcNow;
            }

            _lastRequestTime = DateTime.UtcNow;
        }

        private void UpdateRequestCount()
        {
            _requestCount++;
            Console.WriteLine($"Request sayısı: {_requestCount}/{_maxRequestsPerMinute} (Son dakika)");
        }

        private TimeSpan GetRetryAfterDelay(string responseString)
        {
            try
            {
                var json = JObject.Parse(responseString);
                var retryInfo = json["error"]?["details"]?.FirstOrDefault(d => d["@type"]?.ToString().Contains("RetryInfo") == true);

                if (retryInfo != null)
                {
                    var retryDelay = retryInfo["retryDelay"]?.ToString();
                    if (!string.IsNullOrEmpty(retryDelay))
                    {
                        // "27s" formatını parse et
                        if (retryDelay.EndsWith("s"))
                        {
                            var seconds = int.Parse(retryDelay.Replace("s", ""));
                            return TimeSpan.FromSeconds(seconds);
                        }
                    }
                }
            }
            catch
            {
                // Parse hatası varsa varsayılan değer kullan
            }

            // Varsayılan 30 saniye
            return TimeSpan.FromSeconds(30);
        }

        // Quota durumunu kontrol etmek için
        public async Task<object> GetQuotaStatus()
        {
            return new
            {
                lastRequestTime = _lastRequestTime,
                requestCount = _requestCount,
                requestCountResetTime = _requestCountResetTime,
                nextAvailableTime = _lastRequestTime.Add(_minimumDelay),
                remainingRequestsThisMinute = Math.Max(0, _maxRequestsPerMinute - _requestCount)
            };
        }

        public async Task<(decimal SuggestedPrice, (decimal Min, decimal Max)? PriceRange)> GetSuggestedPrice(string productName, string category, decimal purchasePrice = 0)
        {
            try
            {
                var prompt = $@"
                Sen bir fiyatlandırma ve pazar analizi uzmanısın. Aşağıdaki ürün için Türkiye pazarında rekabetçi fiyat aralığı öner:

                Ürün Adı: {productName}
                Kategori: {category}
                Alış Fiyatı: {purchasePrice:C}

                PAZAR ANALİZİ YAP:
                1. Türkiye'deki güncel piyasa fiyatlarını araştır
                2. Benzer ürünlerin fiyatlarını karşılaştır
                3. Minimum ve maksimum rekabetçi fiyat aralığı belirle
                4. Kar marjını optimize et

                FİYAT ARALIĞI KURALLARI:
                1. Format: 'min-max' şeklinde döndür (örn: 60000-65000)
                2. Alış fiyatından düşük fiyat önerme
                3. Minimum %15 kar marjı
                4. Maksimum %100 kar marjı
                5. Piyasa fiyatlarının %10-20 altında rekabetçi aralık

                ÖRNEK ANALİZ:
                - iPhone 15 Pro 256GB piyasa fiyatı: 65,000-75,000 TL
                - Rekabetçi aralık: 60,000-65,000 TL
                - Alış fiyatı 45,000 TL ise, öneri: 60000-65000

                Sadece 'min-max' formatında döndür. Örnek çıktı: 60000-65000";

                // AI'dan pazar analizi al
                var response = await AskGemini(prompt, "gemini-1.5-flash", "price_suggestion");
                
                // Fiyat aralığını parse et (örn: "60000-65000")
                var priceRange = ParsePriceRange(response);
                
                if (priceRange.HasValue)
                {
                    // Ortalama fiyatı döndür
                    var averagePrice = (priceRange.Value.Min + priceRange.Value.Max) / 2;
                    return (averagePrice, priceRange);
                }
                
                // Fallback: Kategori bazlı kar marjı
                var fallbackMultiplier = category.ToLower() switch
                {
                    "elektronik" => 1.25m, // %25 kar marjı
                    "giyim" => 1.60m,      // %60 kar marjı
                    "kitap" => 1.50m,      // %50 kar marjı
                    "ev & yaşam" => 1.55m, // %55 kar marjı
                    "spor" => 1.65m,       // %65 kar marjı
                    _ => 1.40m             // %40 kar marjı (varsayılan)
                };
                
                var fallbackPrice = purchasePrice * fallbackMultiplier;
                return (fallbackPrice, null);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Fiyat önerisi hatası: {ex.Message}");
                // Fallback: Kategori bazlı kar marjı
                if (purchasePrice > 0)
                {
                    var fallbackMultiplier = category.ToLower() switch
                    {
                        "elektronik" => 1.25m, // %25 kar marjı
                        "giyim" => 1.60m,      // %60 kar marjı
                        "kitap" => 1.50m,      // %50 kar marjı
                        "ev & yaşam" => 1.55m, // %55 kar marjı
                        "spor" => 1.65m,       // %65 kar marjı
                        _ => 1.40m             // %40 kar marjı (varsayılan)
                    };
                    
                    var result = purchasePrice * fallbackMultiplier;
                    
                    // Sayı formatını düzelt (56.25 -> 56250)
                    if (result < 1000 && purchasePrice > 1000)
                    {
                        result = result * 1000;
                    }
                    
                    return (result, null);
                }
                return (100m, null); // Varsayılan değer
            }
        }

        private (decimal Min, decimal Max)? ParsePriceRange(string text)
        {
            try
            {
                // "60000-65000" formatını ara
                var match = System.Text.RegularExpressions.Regex.Match(text, @"(\d+)-(\d+)");
                if (match.Success)
                {
                    var min = decimal.Parse(match.Groups[1].Value);
                    var max = decimal.Parse(match.Groups[2].Value);
                    return (min, max);
                }
                return null;
            }
            catch
            {
                return null;
            }
        }

        private decimal ExtractNumericValue(string text)
        {
            try
            {
                // Sayısal değerleri bul
                var numbers = System.Text.RegularExpressions.Regex.Matches(text, @"\d+[.,]?\d*")
                    .Cast<System.Text.RegularExpressions.Match>()
                    .Select(m => m.Value)
                    .ToList();

                if (numbers.Any())
                {
                    // İlk sayıyı al ve decimal'e çevir
                    var firstNumber = numbers.First().Replace(',', '.');
                    if (decimal.TryParse(firstNumber, out decimal result))
                    {
                        return result;
                    }
                }

                return 0;
            }
            catch
            {
                return 0;
            }
        }

        public async Task<int> GetEstimatedStockOutDays(string productName, string category, int currentStock, int monthlySales = 0)
        {
            try
            {
                var prompt = $@"
                Sen bir stok yönetimi uzmanısın. Aşağıdaki ürün için tahmini stok bitimi gününü hesapla:

                Ürün Adı: {productName}
                Kategori: {category}
                Mevcut Stok: {currentStock} adet
                Aylık Satış: {monthlySales} adet (eğer 0 ise kategori ortalamasına göre tahmin et)

                Kurallar:
                1. Sadece gün sayısı döndür (sayı olarak)
                2. Kategori ve ürün özelliklerine göre satış hızını analiz et
                3. Mevsimsellik faktörlerini dikkate al
                4. Türkiye pazarı koşullarını göz önünde bulundur
                5. Sadece sayı döndür, açıklama yapma

                Örnek çıktı: 45";

                var response = await AskGemini(prompt, "gemini-1.5-flash", "stock_prediction");
                
                // Sadece sayısal değeri çıkar
                var numericValue = ExtractNumericValue(response);
                
                return (int)numericValue > 0 ? (int)numericValue : CalculateFallbackDays(currentStock, monthlySales);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Stok tahmin hatası: {ex.Message}");
                return CalculateFallbackDays(currentStock, monthlySales);
            }
        }

        private int CalculateFallbackDays(int currentStock, int monthlySales)
        {
            if (monthlySales > 0)
            {
                // Aylık satış varsa günlük ortalamaya göre hesapla
                var dailySales = monthlySales / 30.0;
                return dailySales > 0 ? (int)(currentStock / dailySales) : 90;
            }
            
            // Kategori bazlı varsayılan değerler
            return currentStock > 0 ? Math.Min(currentStock * 2, 90) : 90; // Maksimum 90 gün
        }
    }
}