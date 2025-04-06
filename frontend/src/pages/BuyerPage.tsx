import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

// Temporary mock data for listings
const mockListings = [
  {
    id: 1,
    title: "Vintage Camera",
    description: "A beautiful vintage camera in excellent condition",
    price: 199.99,
    location: "Seattle, WA",
    imageUrl:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400",
  },
  {
    id: 2,
    title: "Mountain Bike",
    description: "Barely used mountain bike, perfect for trails",
    price: 349.99,
    location: "Portland, OR",
    imageUrl:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=400",
  },
  {
    id: 3,
    title: "Leather Jacket",
    description: "Genuine leather jacket, size M",
    price: 89.99,
    location: "San Francisco, CA",
    imageUrl:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=400",
  },
];

export default function BuyerPage() {
  const [listings, setListings] = useState(mockListings);

  useEffect(() => {
    const connectRealtimeApi = async () => {
      const response = await fetch("http://127.0.0.1:8000/create-realtime-key");
      const data = await response.json();
      console.log(data);
    };
    connectRealtimeApi();
  }, []);

  return (
    <main className="mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Browse Items</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden">
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-1">{listing.title}</h3>
              <p className="text-green-600 font-bold mb-2">
                ${listing.price.toFixed(2)}
              </p>
              <p className="text-gray-600 text-sm mb-3">{listing.location}</p>
              <p className="text-gray-700 line-clamp-2">
                {listing.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
