import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import BuyerPage from "@/pages/BuyerPage";
import SellerPage from "@/pages/SellerPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<BuyerPage />} />
          <Route path="sell" element={<SellerPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
