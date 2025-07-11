import { useState } from "react";
import { useRouter } from "next/router";

export default function AddProductPage() {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState(1); // Örnek kategori id
  const [priceSale, setPriceSale] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(0);

  const router = useRouter();

  const handleAddProduct = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Önce giriş yapmalısınız!");
      router.push("/login");
      return;
    }

    const res = await fetch("http://localhost:5088/api/products", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        name,
        sku,
        categoryId,
        priceSale,
        stockQuantity,
        stockCritical: 10,
        unit: "adet",
        description: "Test ürünü",
        photoUrl: ""
      }),
    });

    if (res.ok) {
      alert("Ürün başarıyla eklendi!");
      // Dilersen formu sıfırla
      setName("");
      setSku("");
      setCategoryId(1);
      setPriceSale(0);
      setStockQuantity(0);
    } else {
      alert("Ürün ekleme başarısız!");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Ürün Ekle</h1>
      <input
        type="text"
        placeholder="Ürün Adı"
        value={name}
        onChange={e => setName(e.target.value)}
        className="border p-2 rounded mb-3 w-full text-black"
      />
      <input
        type="text"
        placeholder="SKU"
        value={sku}
        onChange={e => setSku(e.target.value)}
        className="border p-2 rounded mb-3 w-full text-black"
      />
      <input
        type="number"
        placeholder="Kategori ID"
        value={categoryId}
        onChange={e => setCategoryId(Number(e.target.value))}
        className="border p-2 rounded mb-3 w-full text-black"
      />
      <input
        type="number"
        placeholder="Satış Fiyatı"
        value={priceSale}
        onChange={e => setPriceSale(Number(e.target.value))}
        className="border p-2 rounded mb-3 w-full text-black"
      />
      <input
        type="number"
        placeholder="Stok Miktarı"
        value={stockQuantity}
        onChange={e => setStockQuantity(Number(e.target.value))}
        className="border p-2 rounded mb-3 w-full text-black"
      />
      <button
        onClick={handleAddProduct}
        className="bg-green-600 text-white p-2 rounded w-full hover:bg-green-700"
      >
        Ürün Ekle
      </button>
    </div>
  );
}
