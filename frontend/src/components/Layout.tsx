import { Link, Outlet, useLocation } from "react-router-dom";
import { ShoppingCart, Tag } from "lucide-react";

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen w-full flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">
              AI-Commerce
            </Link>

            <nav className="flex space-x-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md flex items-center ${
                  location.pathname === "/"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                <span>Buy</span>
              </Link>

              <Link
                to="/sell"
                className={`px-3 py-2 rounded-md flex items-center ${
                  location.pathname === "/sell"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Tag className="h-4 w-4 mr-1" />
                <span>Sell</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 py-6">
        <Outlet />
      </main>

      <footer className="bg-gray-50 border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} AI-Commerce. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
