"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const products = [
  {
    name: "Design 01",
    image: "/products/t-shirt1.png",
    price: 199,
    stock: { S: 2, M: 2, L: 2, XL: 2 },
  },
  {
    name: "Design 02",
    image: "/products/t-shirt2.png",
    price: 199,
    stock: { S: 2, M: 2, L: 2, XL: 2 },
  },
  {
    name: "Design 03",
    image: "/products/t-shirt3.png",
    price: 199,
    stock: { S: 2, M: 2, L: 2, XL: 2 },
  },
  {
    name: "Design 04",
    image: "/products/t-shirt4.png",
    price: 199,
    stock: { S: 2, M: 2, L: 2, XL: 2 },
  },
  {
    name: "Design 05",
    image: "/products/t-shirt5.png",
    price: 199,
    stock: { S: 2, M: 2, L: 2, XL: 2 },
  },
];

const sizes = ["S", "M", "L", "XL"] as const;

type Size = (typeof sizes)[number];
type Product = (typeof products)[number];

type CartItem = {
  product: Product;
  size: Size;
  quantity: number;
};

const deliveryPrices: Record<string, number> = {
  Casablanca: 20,
  Rabat: 25,
  Salé: 25,
  Mohammedia: 25,
  Marrakech: 35,
  Agadir: 35,
  Fès: 35,
  Meknès: 35,
  Tanger: 35,
  Other: 40,
};

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [selectedSizes, setSelectedSizes] = useState<
    Record<string, Size>
  >({});

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
  });

  // =========================
  // CART QUANTITY
  // =========================

  const getCartQuantity = (
    productName: string,
    size: Size
  ) => {
    return cart
      .filter(
        (item) =>
          item.product.name === productName &&
          item.size === size
      )
      .reduce(
        (sum, item) => sum + item.quantity,
        0
      );
  };

  // =========================
  // REMAINING STOCK
  // =========================

  const getRemainingStock = (
    product: Product,
    size: Size
  ) => {
    return (
      product.stock[size] -
      getCartQuantity(product.name, size)
    );
  };

  // =========================
  // ADD TO CART
  // =========================

  const addToCart = (product: Product) => {
    const size =
      selectedSizes[product.name] || "M";

    const remaining =
      getRemainingStock(product, size);

    if (remaining <= 0) {
      return;
    }

    setCart((current) => {
      const existingItem = current.find(
        (item) =>
          item.product.name === product.name &&
          item.size === size
      );

      if (existingItem) {
        if (
          existingItem.quantity >=
          product.stock[size]
        ) {
          return current;
        }

        return current.map((item) =>
          item.product.name === product.name &&
          item.size === size
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...current,
        {
          product,
          size,
          quantity: 1,
        },
      ];
    });

    setCartOpen(true);
  };

  // =========================
  // INCREASE
  // =========================

  const increaseQuantity = (index: number) => {
    setCart((current) =>
      current.map((item, i) => {
        if (i !== index) {
          return item;
        }

        if (
          item.quantity >=
          item.product.stock[item.size]
        ) {
          return item;
        }

        return {
          ...item,
          quantity:
            item.quantity + 1,
        };
      })
    );
  };

  // =========================
  // DECREASE
  // =========================

  const decreaseQuantity = (index: number) => {
    setCart((current) =>
      current
        .map((item, i) =>
          i === index
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) => item.quantity > 0
        )
    );
  };

  // =========================
  // REMOVE
  // =========================

  const removeFromCart = (index: number) => {
    setCart((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );
  };

  // =========================
  // TOTALS
  // =========================

  const totalItems = cart.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );

  const total = cart.reduce(
    (sum, item) =>
      sum +
      item.product.price *
        item.quantity,
    0
  );

  const deliveryFee =
    deliveryPrices[customer.city] ?? 0;

  const finalTotal =
    total + deliveryFee;

  // =========================
  // CONFIRM ORDER
  // =========================

  const confirmOrder = async () => {
    if (
      !customer.name.trim() ||
      !customer.phone.trim() ||
      !customer.city.trim() ||
      !customer.address.trim()
    ) {
      alert(
        "Please complete all delivery information."
      );
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const productsData = cart.map(
      (item) => ({
        product: item.product.name,
        size: item.size,
        quantity: item.quantity,
        price: item.product.price,
      })
    );

    // SAVE ORDER TO SUPABASE

    const { error } = await supabase
      .from("orders")
      .insert({
        customer_name: customer.name,
        phone: customer.phone,
        city: customer.city,
        address: customer.address,
        products: productsData,
        products_total: total,
        delivery_fee: deliveryFee,
        total: finalTotal,
        status: "Pending",
      });

    if (error) {
      console.error(
        "SUPABASE ERROR:",
        error
      );

      alert(error.message);

      return;
    }

    // WHATSAPP MESSAGE

    const orderDetails = cart
      .map(
        (item, index) =>
          `${index + 1}. ${item.product.name}
Size: ${item.size}
Quantity: ${item.quantity}
Price: ${
            item.product.price *
            item.quantity
          } DH`
      )
      .join("\n\n");

    const message =
      `SALAM LF WEAR 👋\n\n` +
      `NEW ORDER\n\n` +
      `Customer: ${customer.name}\n` +
      `Phone: ${customer.phone}\n` +
      `City: ${customer.city}\n` +
      `Address: ${customer.address}\n\n` +
      `ORDER:\n\n${orderDetails}\n\n` +
      `PRODUCTS: ${total} DH\n` +
      `DELIVERY: ${deliveryFee} DH\n` +
      `TOTAL: ${finalTotal} DH\n\n` +
      `Payment: Cash on Delivery`;

    const whatsappUrl =
      `https://wa.me/212666462061?text=` +
      encodeURIComponent(message);

    window.open(
      whatsappUrl,
      "_blank"
    );
  };

  return (
    <main className="min-h-screen bg-black text-white">

      {/* NAVBAR */}

      <nav className="flex items-center justify-between px-6 py-6 md:px-12">

        <div className="text-2xl font-black tracking-[0.2em]">
          LF
        </div>

        <div className="hidden gap-8 text-sm uppercase tracking-widest md:flex">

          <a
            href="#shop"
            className="hover:opacity-50"
          >
            Shop
          </a>

          <a
            href="#about"
            className="hover:opacity-50"
          >
            About
          </a>

          <a
            href="#contact"
            className="hover:opacity-50"
          >
            Contact
          </a>

        </div>

        <button
          onClick={() =>
            setCartOpen(true)
          }
          className="border border-white px-5 py-2 text-xs uppercase tracking-widest hover:bg-white hover:text-black"
        >
          Cart ({totalItems})
        </button>

      </nav>

      {/* HERO */}

      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 text-center">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_55%)]" />

        <div className="relative z-10">

          <p className="mb-6 text-[10px] uppercase tracking-[0.5em] text-zinc-500 sm:text-xs">
            LF Wear — Drop 01
          </p>

          <h1 className="text-6xl font-black uppercase leading-[0.85] tracking-[-0.05em] sm:text-8xl md:text-[10rem]">
            Wear
            <br />
            Your
            <br />
            Identity.
          </h1>

          <p className="mx-auto mt-8 max-w-md text-sm leading-7 text-zinc-400">
            Bold designs.
            Premium quality.
            Limited pieces.
            <br />
            Made to stand out.
          </p>

          <a
            href="#shop"
            className="mt-10 inline-block border border-white bg-white px-10 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-black hover:bg-transparent hover:text-white"
          >
            Discover Drop 01
          </a>

        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.4em] text-zinc-600">
          Scroll to explore
        </div>

      </section>

      {/* SHOP */}

      <section
        id="shop"
        className="border-t border-zinc-800 px-6 py-24 md:px-12"
      >

        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">

          <div>

            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-zinc-500">
              Latest collection
            </p>

            <h2 className="text-5xl font-black uppercase tracking-tight md:text-7xl">
              Drop 01
            </h2>

          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Limited pieces
          </p>

        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {products.map((product) => {

            const selectedSize =
              selectedSizes[
                product.name
              ] || "M";

            const remaining =
              getRemainingStock(
                product,
                selectedSize
              );

            return (

              <div
                key={product.name}
                className="group overflow-hidden border border-zinc-800 bg-zinc-950"
              >

                <div className="relative aspect-[4/5] overflow-hidden bg-zinc-900">

                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  <div className="absolute left-4 top-4 border border-white/20 bg-black/70 px-3 py-2 text-[9px] uppercase tracking-[0.2em]">
                    Drop 01
                  </div>

                </div>

                <div className="p-5">

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <h3 className="font-semibold uppercase tracking-wide">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500">
                        Premium T-Shirt
                      </p>

                    </div>

                    <p className="font-semibold">
                      {product.price} DH
                    </p>

                  </div>

                  {/* SIZES */}

                  <div className="mt-5">

                    <p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-zinc-500">
                      Select size
                    </p>

                    <div className="grid grid-cols-4 gap-2">

                      {sizes.map((size) => {

                        const sizeRemaining =
                          getRemainingStock(
                            product,
                            size
                          );

                        return (

                          <button
                            key={size}
                            disabled={
                              sizeRemaining <= 0
                            }
                            onClick={() =>
                              setSelectedSizes(
                                (current) => ({
                                  ...current,
                                  [product.name]:
                                    size,
                                })
                              )
                            }
                            className={`border py-3 text-xs font-semibold ${
                              selectedSize ===
                                size &&
                              sizeRemaining > 0
                                ? "border-white bg-white text-black"
                                : "border-zinc-700 text-zinc-400"
                            } ${
                              sizeRemaining <= 0
                                ? "cursor-not-allowed opacity-30"
                                : ""
                            }`}
                          >
                            {size}
                          </button>

                        );
                      })}

                    </div>

                  </div>

                  {/* STOCK */}

                  <div className="mt-4 text-[9px] uppercase tracking-[0.2em]">

                    {remaining > 0 ? (
                      <span className="text-zinc-500">
                        {remaining} piece
                        {remaining > 1 ? "s" : ""}
                        {" "}available
                      </span>
                    ) : (
                      <span className="text-red-400">
                        Sold out
                      </span>
                    )}

                  </div>

                  {/* ADD TO CART */}

                  <button
                    disabled={
                      remaining <= 0
                    }
                    onClick={() =>
                      addToCart(product)
                    }
                    className={`mt-4 block w-full border px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] ${
                      remaining > 0
                        ? "border-white bg-white text-black"
                        : "cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-600"
                    }`}
                  >
                    {remaining > 0
                      ? `Add to Cart — Size ${selectedSize}`
                      : "Sold Out"}
                  </button>

                  {/* WHATSAPP */}

                  <a
                    href={
                      remaining > 0
                        ? `https://wa.me/212666462061?text=${encodeURIComponent(
                            `Salam, bghit ${product.name} - Size ${selectedSize} - ${product.price} DH`
                          )}`
                        : "#"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block w-full border border-zinc-700 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.2em]"
                  >
                    Commander WhatsApp
                  </a>

                </div>

              </div>

            );
          })}

        </div>

      </section>

      {/* ABOUT */}

      <section
        id="about"
        className="border-t border-zinc-800 px-6 py-32 md:px-12"
      >

        <div className="mx-auto max-w-5xl">

          <p className="mb-6 text-xs uppercase tracking-[0.4em] text-zinc-500">
            About LF Wear
          </p>

          <h2 className="max-w-4xl text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-8xl">
            Not made
            <br />
            to fit in.
          </h2>

          <div className="mt-12 max-w-2xl">

            <p className="text-sm leading-8 text-zinc-400">
              LF Wear is an independent streetwear brand built for those who choose to stand out.
            </p>

            <p className="mt-5 text-sm leading-8 text-zinc-400">
              We create bold, unique designs using premium-quality materials, produced in limited quantities.
            </p>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.3em]">
              Wear it. Own it. Be different.
            </p>

          </div>

        </div>

      </section>

      {/* FOOTER */}

      <footer
        id="contact"
        className="border-t border-zinc-800 px-6 py-12 md:px-12"
      >

        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">

          <div>

            <div className="text-2xl font-black tracking-[0.2em]">
              LF
            </div>

            <p className="mt-3 text-xs text-zinc-500">
              © 2026 LF Wear. All rights reserved.
            </p>

          </div>

          <div className="text-left md:text-right">

            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Casablanca, Morocco
            </p>

            <a
              href="https://wa.me/212666462061"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-xs uppercase tracking-[0.2em]"
            >
              Contact us on WhatsApp
            </a>

          </div>

        </div>

      </footer>

      {/* CART */}

      {cartOpen && (

        <div className="fixed inset-0 z-50">

          <div
            className="absolute inset-0 bg-black/70"
            onClick={() =>
              setCartOpen(false)
            }
          />

          <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-black">

            <div className="flex items-center justify-between border-b border-zinc-800 p-6">

              <div>

                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                  Your selection
                </p>

                <h2 className="mt-2 text-2xl font-black uppercase">
                  Cart ({totalItems})
                </h2>

              </div>

              <button
                onClick={() =>
                  setCartOpen(false)
                }
                className="text-2xl text-zinc-400"
              >
                ×
              </button>

            </div>

            <div className="flex-1 overflow-y-auto p-6">

              {cart.length === 0 ? (

                <div className="flex h-full items-center justify-center text-center">

                  <p className="text-sm uppercase tracking-widest text-zinc-500">
                    Your cart is empty
                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {cart.map((item, index) => (

                    <div
                      key={`${item.product.name}-${item.size}-${index}`}
                      className="border border-zinc-800 p-3"
                    >

                      <div className="flex gap-4">

                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-24 w-20 object-cover"
                        />

                        <div className="flex flex-1 flex-col justify-between">

                          <div className="flex justify-between gap-3">

                            <div>

                              <h3 className="text-sm font-semibold uppercase">
                                {item.product.name}
                              </h3>

                              <p className="mt-1 text-xs text-zinc-500">
                                Size: {item.size}
                              </p>

                            </div>

                            <p className="text-sm font-semibold">
                              {item.product.price *
                                item.quantity}{" "}
                              DH
                            </p>

                          </div>

                          <div className="mt-4 flex items-center justify-between">

                            <div className="flex items-center border border-zinc-700">

                              <button
                                onClick={() =>
                                  decreaseQuantity(index)
                                }
                                className="px-3 py-2"
                              >
                                −
                              </button>

                              <span className="px-4 text-xs">
                                {item.quantity}
                              </span>

                              <button
                                onClick={() =>
                                  increaseQuantity(index)
                                }
                                className="px-3 py-2"
                              >
                                +
                              </button>

                            </div>

                            <button
                              onClick={() =>
                                removeFromCart(index)
                              }
                              className="text-[9px] uppercase tracking-widest text-zinc-500"
                            >
                              Remove
                            </button>

                          </div>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </div>

            {cart.length > 0 && (

              <div className="border-t border-zinc-800 p-6">

                <div className="mb-5 flex items-center justify-between">

                  <span className="text-xs uppercase tracking-widest text-zinc-500">
                    Products
                  </span>

                  <span className="text-xl font-bold">
                    {total} DH
                  </span>

                </div>

                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                  className="block w-full bg-white px-6 py-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-black"
                >
                  Checkout
                </button>

              </div>

            )}

          </div>

        </div>

      )}

      {/* CHECKOUT */}

      {checkoutOpen && (

        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black">

          <div className="mx-auto min-h-screen max-w-2xl px-6 py-10 md:px-10">

            <div className="flex items-center justify-between border-b border-zinc-800 pb-6">

              <div>

                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                  LF Wear
                </p>

                <h2 className="mt-2 text-3xl font-black uppercase">
                  Checkout
                </h2>

              </div>

              <button
                onClick={() =>
                  setCheckoutOpen(false)
                }
                className="text-2xl text-zinc-400"
              >
                ×
              </button>

            </div>

            {/* DELIVERY */}

            <div className="mt-10">

              <h3 className="text-xs font-bold uppercase tracking-[0.2em]">
                Delivery information
              </h3>

              <div className="mt-6 space-y-4">

                <input
                  type="text"
                  placeholder="Full name"
                  value={customer.name}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      name: e.target.value,
                    })
                  }
                  className="w-full border border-zinc-800 bg-zinc-950 px-4 py-4 text-sm outline-none"
                />

                <input
                  type="tel"
                  placeholder="Phone number"
                  value={customer.phone}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      phone: e.target.value,
                    })
                  }
                  className="w-full border border-zinc-800 bg-zinc-950 px-4 py-4 text-sm outline-none"
                />

                <select
                  value={customer.city}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      city: e.target.value,
                    })
                  }
                  className="w-full border border-zinc-800 bg-zinc-950 px-4 py-4 text-sm"
                >

                  <option value="">
                    Select your city
                  </option>

                  <option value="Casablanca">
                    Casablanca — 20 DH
                  </option>

                  <option value="Rabat">
                    Rabat — 25 DH
                  </option>

                  <option value="Salé">
                    Salé — 25 DH
                  </option>

                  <option value="Mohammedia">
                    Mohammedia — 25 DH
                  </option>

                  <option value="Marrakech">
                    Marrakech — 35 DH
                  </option>

                  <option value="Agadir">
                    Agadir — 35 DH
                  </option>

                  <option value="Fès">
                    Fès — 35 DH
                  </option>

                  <option value="Meknès">
                    Meknès — 35 DH
                  </option>

                  <option value="Tanger">
                    Tanger — 35 DH
                  </option>

                  <option value="Other">
                    Other city — 40 DH
                  </option>

                </select>

                <textarea
                  placeholder="Delivery address"
                  value={customer.address}
                  onChange={(e) =>
                    setCustomer({
                      ...customer,
                      address: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full resize-none border border-zinc-800 bg-zinc-950 px-4 py-4 text-sm outline-none"
                />

              </div>

            </div>

            {/* ORDER SUMMARY */}

            <div className="mt-10 border-t border-zinc-800 pt-8">

              <h3 className="text-xs font-bold uppercase tracking-[0.2em]">
                Order summary
              </h3>

              <div className="mt-6 space-y-4">

                {cart.map((item, index) => (

                  <div
                    key={`${item.product.name}-${item.size}-${index}`}
                    className="flex justify-between border-b border-zinc-900 pb-4"
                  >

                    <div>

                      <p className="text-sm font-semibold uppercase">
                        {item.product.name}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Size {item.size} ×{" "}
                        {item.quantity}
                      </p>

                    </div>

                    <p className="text-sm">
                      {item.product.price *
                        item.quantity}{" "}
                      DH
                    </p>

                  </div>

                ))}

              </div>

              <div className="mt-6 space-y-3 border-t border-zinc-900 pt-5">

                <div className="flex justify-between text-sm">

                  <span className="text-zinc-500">
                    Products
                  </span>

                  <span>
                    {total} DH
                  </span>

                </div>

                <div className="flex justify-between text-sm">

                  <span className="text-zinc-500">
                    Livraison
                  </span>

                  <span>
                    {deliveryFee > 0
                      ? `${deliveryFee} DH`
                      : "—"}
                  </span>

                </div>

                <div className="flex justify-between border-t border-zinc-800 pt-4">

                  <span className="text-xs font-bold uppercase tracking-widest">
                    Total
                  </span>

                  <span className="text-2xl font-black">
                    {finalTotal} DH
                  </span>

                </div>

              </div>

              <p className="mt-4 text-xs text-zinc-500">
                Payment method: Cash on Delivery
              </p>

            </div>

            {/* CONFIRM */}

            <button
              onClick={confirmOrder}
              className="mt-8 w-full bg-white px-6 py-5 text-[10px] font-bold uppercase tracking-[0.25em] text-black"
            >
              Confirm Order via WhatsApp
            </button>

            <button
              onClick={() => {
                setCheckoutOpen(false);
                setCartOpen(true);
              }}
              className="mt-3 w-full border border-zinc-800 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400"
            >
              Back to Cart
            </button>

          </div>

        </div>

      )}

    </main>
  );
}