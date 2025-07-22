// app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Burada kendi register API çağrını yapabilirsin
    // Örnek:
    /*
    const res = await fetch("http://localhost:5088/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) router.push("/login");
    else alert("Kayıt başarısız");
    */
    alert("Register API eklenmeli");
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-80"
      >
        <h1 className="text-2xl font-bold mb-4">Kayıt Ol</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded mb-4 w-full text-black"
          required
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded mb-4 w-full text-black"
          required
        />
        <button
          type="submit"
          className="bg-green-600 text-white p-2 rounded w-full hover:bg-green-700"
        >
          Kayıt Ol
        </button>
      </form>
    </div>
  );
}
