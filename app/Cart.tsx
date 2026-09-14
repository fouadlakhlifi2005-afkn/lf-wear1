"use client";

import { useState } from "react";

type Product = {
  name: string;
  image: string;
  price: number;
};

export default function Cart() {
  const [cart, setCart] = useState<Product[]>([]);

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const total = cart.reduce((sum, product) => sum + product.price, 0);

  return (
    <div className="min-h-screen bg-black p-6 text-white md:p-12">
      <h1 className="mb-10 text-4xl font-black uppercase">Your Cart</h1>

      {cart.length === 0 ? (
        <p className="text-zinc-500">Your cart is empty.</p>
      ) : (
        <div className="space-y-4">
          {cart.map((product, index) => (
            <div
              key={index}
              className="flex items-center justify-between border border-zinc-800 p-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-20 w-16 object-cover"
                />

                <div>
                  <h2 className="font-semibold uppercase">{product.name}</h2>
                  <p className="text-sm text-zinc-500">{product.price} DH</p>
                </div>
              </div>

              <button
                onClick={() => removeFromCart(index)}
                className="text-xs uppercase tracking-widest text-zinc-400 hover:text-white"
              >
                Remove
              </button>
            </div>
          ))}

          <div className="mt-10 border-t border-zinc-800 pt-6">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{total} DH</span>
            </div>

            <a
              href={`https://wa.me/212666462061?text=${encodeURIComponent(
                `Salam, bghit commander: ${cart
                  .map((product) => product.name)
                  .join(", ")} - Total: ${total} DH`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block bg-white px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-black hover:bg-zinc-200"
            >
              Commander via WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}