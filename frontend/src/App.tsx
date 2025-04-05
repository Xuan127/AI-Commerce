import SellerForm from "@/components/seller-form";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Sell Your Item</h1>
      <SellerForm />
    </main>
  );
}
