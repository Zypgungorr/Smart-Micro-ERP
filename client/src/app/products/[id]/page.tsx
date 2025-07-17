// app/products/[id]/page.tsx
import { useRouter } from "next/navigation";

interface Props {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: Props) {
  const { id } = params;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Ürün Detayı: {id}</h1>
      <p>Burada ürün bilgileri gösterilecek.</p>
    </div>
  );
}
