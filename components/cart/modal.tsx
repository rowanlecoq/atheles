"use client";

import { Dialog, Transition } from "@headlessui/react";
import {
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  TagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import LoadingDots from "components/loading-dots";
import Price from "components/price";
import { DEFAULT_OPTION } from "lib/constants";
import type { CartItem, Product, ProductVariant } from "lib/shopify/types";
import { createUrl } from "lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  addItem,
  applyDiscountCode,
  createCartAndSetCookie,
  redirectToCheckout,
  removeDiscountCode,
  removeItem,
  updateItemQuantity,
} from "./actions";
import { MAX_ITEM_QUANTITY, useCart } from "./cart-context";
import OpenCart from "./open-cart";

type FavProduct = {
  id?: string;
  handle: string;
  title: string;
  featuredImage?: { url: string } | null;
  priceRange: { maxVariantPrice: { amount: string; currencyCode: string } };
  firstVariantId?: string | null;
  firstVariantTitle?: string;
  firstVariantPrice?: { amount: string; currencyCode: string } | null;
  firstVariantOptions?: { name: string; value: string }[];
  availableForSale?: boolean;
};

// ─── Cart line item ────────────────────────────────────────────────────────────

function CartLineItem({ item }: { item: CartItem }) {
  const { cart, setCart } = useCart();

  const searchParams: Record<string, string> = {};
  item.merchandise.selectedOptions.forEach(({ name, value }) => {
    if (value !== DEFAULT_OPTION) searchParams[name.toLowerCase()] = value;
  });
  const url = createUrl(
    `/product/${item.merchandise.product.handle}`,
    new URLSearchParams(searchParams),
  );

  // Recompute cart totals after a lines change.
  const applyLines = (prev: NonNullable<typeof cart>, lines: CartItem[]) => {
    const subtotal = lines.reduce((s, l) => s + parseFloat(l.cost.totalAmount.amount), 0);
    const discount = (prev.discountAllocations ?? []).reduce(
      (s, a) => s + parseFloat(a.discountedAmount.amount), 0,
    );
    const cc = prev.cost.totalAmount.currencyCode;
    return {
      ...prev,
      lines,
      totalQuantity: lines.reduce((s, l) => s + l.quantity, 0),
      cost: {
        ...prev.cost,
        subtotalAmount: { amount: subtotal.toFixed(2), currencyCode: cc },
        totalAmount: { amount: Math.max(0, subtotal - discount).toFixed(2), currencyCode: cc },
      },
    };
  };

  const handleRemove = async () => {
    const snapshot = cart;
    // Optimistic: remove immediately so favorites carousel updates instantly.
    setCart((prev) => prev ? applyLines(prev, prev.lines.filter(l => l.merchandise.id !== item.merchandise.id)) : prev);
    try {
      const result = await removeItem(null, { lineItemId: item.id, merchandiseId: item.merchandise.id });
      if (result && typeof result === "object" && "cart" in result) setCart(result.cart);
    } catch {
      setCart(snapshot);
    }
  };

  const handleQty = async (type: "plus" | "minus") => {
    const snapshot = cart;
    const newQty = type === "plus" ? item.quantity + 1 : item.quantity - 1;
    setCart((prev) => {
      if (!prev) return prev;
      if (newQty <= 0) return applyLines(prev, prev.lines.filter(l => l.merchandise.id !== item.merchandise.id));
      const lines = prev.lines.map(l => {
        if (l.merchandise.id !== item.merchandise.id) return l;
        const unitPrice = parseFloat(l.cost.totalAmount.amount) / l.quantity;
        return { ...l, quantity: newQty, cost: { ...l.cost, totalAmount: { ...l.cost.totalAmount, amount: (unitPrice * newQty).toFixed(2) } } };
      });
      return applyLines(prev, lines);
    });
    try {
      const result = await updateItemQuantity(null, { lineItemId: item.id, merchandiseId: item.merchandise.id, quantity: newQty });
      if (result && typeof result === "object" && "cart" in result) setCart(result.cart);
    } catch {
      setCart(snapshot);
    }
  };

  const stockLimit = typeof item.merchandise.quantityAvailable === "number" ? item.merchandise.quantityAvailable : MAX_ITEM_QUANTITY;
  const atMax = item.quantity >= Math.min(stockLimit, MAX_ITEM_QUANTITY) || item.merchandise.availableForSale === false;

  return (
    <li className="flex gap-3 py-4 border-b border-white/5">
      {/* Thumbnail */}
      <div className="relative h-20 w-20 flex-none overflow-hidden rounded-lg bg-white/5">
        <Image
          src={item.merchandise.product.featuredImage.url}
          alt={item.merchandise.product.featuredImage.altText || item.merchandise.product.title}
          fill
          sizes="80px"
          className="object-cover"
          priority
        />
      </div>

      {/* Info + controls */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <a href={url} className="block text-sm font-medium text-white leading-snug line-clamp-2 hover:text-brand-gold transition-colors">
              {item.merchandise.product.title}
            </a>
            {item.merchandise.title !== DEFAULT_OPTION && (
              <p className="mt-0.5 text-xs text-white/40">{item.merchandise.title}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove item"
            className="flex-none mt-0.5 text-white/30 hover:text-red-400 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Qty controls */}
          <div className="flex items-center gap-1 rounded-full border border-white/10 px-1">
            <button
              type="button"
              onClick={() => handleQty("minus")}
              aria-label="Decrease quantity"
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:text-white transition-colors"
            >
              <MinusIcon className="h-3 w-3" />
            </button>
            <span className="w-5 text-center text-sm text-white tabular-nums">{item.quantity}</span>
            <button
              type="button"
              onClick={() => !atMax && handleQty("plus")}
              disabled={atMax}
              aria-label={atMax ? (item.merchandise.availableForSale ? "Maximum quantity reached" : "Out of stock") : "Increase quantity"}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-25"
            >
              <PlusIcon className="h-3 w-3" />
            </button>
          </div>
          {/* Line total */}
          <Price
            className="text-sm font-medium text-white"
            amount={item.cost.totalAmount.amount}
            currencyCode={item.cost.totalAmount.currencyCode}
          />
        </div>
      </div>
    </li>
  );
}

// ─── Favorites carousel ────────────────────────────────────────────────────────

function FavoritesCarousel({
  products,
  onAdd,
  onClose,
  addingHandle,
}: {
  products: FavProduct[];
  onAdd: (p: FavProduct) => void;
  onClose: () => void;
  addingHandle: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="pt-4 border-t border-white/5">
      <div className="flex items-center justify-between mb-3">
        <Link
          href="/favorites"
          onClick={onClose}
          className="flex items-center gap-1.5 group"
        >
          <HeartSolidIcon className="h-3.5 w-3.5 text-brand-gold" />
          <span className="text-xs uppercase tracking-wider text-white/40 group-hover:text-brand-gold transition-colors">
            from your favorites
          </span>
        </Link>
      </div>
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {products.map((p) => {
          const canAdd = !!p.firstVariantId && !!p.availableForSale;
          const isAdding = addingHandle === p.handle;
          return (
            <button
              key={p.handle}
              type="button"
              disabled={!canAdd || isAdding}
              onClick={() => canAdd && !isAdding && onAdd(p)}
              className="group/card flex-none w-[110px] rounded-lg border border-white/5 bg-white/3 p-1.5 text-left transition-colors hover:border-brand-gold/30 disabled:opacity-40"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-md mb-1.5">
                {p.featuredImage?.url ? (
                  <Image
                    src={p.featuredImage.url}
                    alt={p.title}
                    fill
                    sizes="110px"
                    className={`object-cover transition-opacity ${!canAdd ? "opacity-50" : "group-hover/card:opacity-80"}`}
                    priority
                  />
                ) : (
                  <div className="h-full w-full bg-white/5 flex items-center justify-center">
                    <span className="text-[8px] text-white/30">ATHELES</span>
                  </div>
                )}
                {isAdding && (
                  <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/60 rounded-md">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-brand-gold" />
                  </div>
                )}
                {!canAdd && !isAdding && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] uppercase tracking-wider text-red-400/80">sold out</span>
                  </div>
                )}
              </div>
              <p className="truncate text-[10px] text-white/60 group-hover/card:text-white transition-colors">{p.title}</p>
              <p className="text-[10px] text-brand-gold mt-0.5">
                {p.firstVariantPrice
                  ? new Intl.NumberFormat(undefined, { style: "currency", currency: p.firstVariantPrice.currencyCode, currencyDisplay: "narrowSymbol" }).format(parseFloat(p.firstVariantPrice.amount))
                  : new Intl.NumberFormat(undefined, { style: "currency", currency: p.priceRange.maxVariantPrice.currencyCode, currencyDisplay: "narrowSymbol" }).format(parseFloat(p.priceRange.maxVariantPrice.amount))
                }
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function CartModal() {
  const { cart, setCart, addCartItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [addingHandle, setAddingHandle] = useState<string | null>(null);
  const [favProducts, setFavProducts] = useState<FavProduct[]>([]);
  const [discountInput, setDiscountInput] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountConfirmed, setDiscountConfirmed] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);
  const [tierName, setTierName] = useState<string | null>(null);
  const favCacheRef = useRef<FavProduct[] | null>(null);
  const discountSyncedRef = useRef(false);
  const closedAtRef = useRef(0);

  const openCart = useCallback(() => {
    if (Date.now() - closedAtRef.current < 500) return;
    setIsOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    closedAtRef.current = Date.now();
    setIsOpen(false);
  }, []);

  // Ensure a cart cookie exists
  useEffect(() => {
    if (!cart) createCartAndSetCookie();
  }, [cart]);

  // open-cart event from add-to-cart buttons (respects cooldown)
  useEffect(() => {
    const handler = () => openCart();
    window.addEventListener("open-cart", handler);
    return () => window.removeEventListener("open-cart", handler);
  }, [openCart]);

  // Sync applied discount code when cart opens
  useEffect(() => {
    if (!isOpen) { discountSyncedRef.current = false; return; }
    if (discountSyncedRef.current) return;
    discountSyncedRef.current = true;
    const active = cart?.discountCodes?.find((dc) => dc.applicable);
    const hasAmount = (cart?.discountAllocations ?? []).reduce(
      (s, a) => s + parseFloat(a.discountedAmount?.amount || "0"), 0,
    ) > 0;
    if (active && hasAmount) { setAppliedCode(active.code); setDiscountConfirmed(true); }
  }, [isOpen, cart?.discountCodes, cart?.discountAllocations]);

  // Confirm discount once Shopify allocations arrive
  useEffect(() => {
    if (!appliedCode || discountConfirmed) return;
    const hasAmount = (cart?.discountAllocations ?? []).reduce(
      (s, a) => s + parseFloat(a.discountedAmount?.amount || "0"), 0,
    ) > 0;
    if (hasAmount) setDiscountConfirmed(true);
  }, [appliedCode, discountConfirmed, cart?.discountAllocations]);

  // Tier / free shipping
  useEffect(() => {
    if (!isOpen) return;
    if (!document.cookie.includes("atheles-logged-in=1")) {
      setFreeShipping(false); setTierName(null); return;
    }
    const apply = (totalSpent: string, isAthlete?: boolean) => {
      if (isAthlete) { setTierName("ATHLETE"); setFreeShipping(true); return; }
      const pts = Math.floor(parseFloat(totalSpent || "0") * 50);
      const tier =
        pts >= 50000 ? "CHAMPION" : pts >= 30000 ? "PLATINUM" :
        pts >= 15000 ? "GOLD" : pts >= 5000 ? "SILVER" : "BRONZE";
      setTierName(tier); setFreeShipping(tier === "CHAMPION");
    };
    try {
      const cached = localStorage.getItem("atheles-session");
      if (cached) { const u = JSON.parse(cached); apply(u.totalSpent, u.isAthlete); return; }
    } catch {}
    fetch("/api/auth/session")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.user) apply(d.user.totalSpent, d.user.isAthlete); })
      .catch(() => {});
  }, [isOpen]);

  // Load favorites once per open
  useEffect(() => {
    if (!isOpen) return;
    if (favCacheRef.current) { setFavProducts(favCacheRef.current); return; }
    try {
      const handles: string[] = JSON.parse(localStorage.getItem("atheles-favorites") || "[]");
      if (!handles.length) { setFavProducts([]); return; }
      fetch("/api/products/by-handles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handles: handles.slice(0, 6) }),
      })
        .then((r) => r.ok ? r.json() : { products: [] })
        .then((d) => { const p = d.products || []; favCacheRef.current = p; setFavProducts(p); })
        .catch(() => {});
    } catch { setFavProducts([]); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleAddFav = useCallback((p: FavProduct) => {
    if (!p.firstVariantId) return;
    setAddingHandle(p.handle);
    const price = p.firstVariantPrice ?? p.priceRange.maxVariantPrice;
    const syntheticVariant: ProductVariant = {
      id: p.firstVariantId,
      title: p.firstVariantTitle ?? "Default Title",
      availableForSale: p.availableForSale ?? true,
      selectedOptions: p.firstVariantOptions ?? [],
      price,
    };
    const syntheticProduct: Product = {
      id: p.id ?? p.handle,
      handle: p.handle,
      title: p.title,
      availableForSale: p.availableForSale ?? true,
      description: "",
      descriptionHtml: "",
      options: [],
      priceRange: p.priceRange,
      variants: [],
      featuredImage: p.featuredImage
        ? { url: p.featuredImage.url, altText: p.title, width: 800, height: 800 }
        : { url: "", altText: p.title, width: 0, height: 0 },
      images: [],
      seo: { title: "", description: "" },
      tags: [],
      updatedAt: "",
    };
    addCartItem(syntheticVariant, syntheticProduct);
    addItem(null, p.firstVariantId).then((result) => {
      if (result && typeof result === "object" && "cart" in result) {
        setCart(result.cart);
      }
    }).catch(() => {}).finally(() => setAddingHandle(null));
  }, [addCartItem, setCart]);

  const applyDiscount = async (code: string) => {
    if (!code.trim() || applyingDiscount) return;
    setApplyingDiscount(true);
    setDiscountError("");
    setAppliedCode(code);
    setDiscountInput("");
    try {
      const result = await applyDiscountCode(code);
      if (!result.success) {
        setAppliedCode(null); setDiscountConfirmed(false);
        setDiscountError(result.error || "failed to apply code.");
      } else if (!result.applicable) {
        setAppliedCode(null); setDiscountConfirmed(false);
        setDiscountError("invalid or expired code.");
        removeDiscountCode().catch(() => {});
      } else if (result.cart) {
        setCart(result.cart);
        setDiscountConfirmed(true);
      }
    } catch {
      setAppliedCode(null); setDiscountConfirmed(false);
      setDiscountError("failed to apply code.");
    }
    setApplyingDiscount(false);
  };

  const removeDiscount = async () => {
    const prev = cart;
    setAppliedCode(null); setDiscountConfirmed(false);
    setDiscountInput(""); setDiscountError("");
    // Optimistically zero out discount
    if (prev) {
      setCart({
        ...prev,
        discountCodes: [],
        discountAllocations: [],
        cost: { ...prev.cost, totalAmount: { ...prev.cost.subtotalAmount } },
      });
    }
    const confirmed = await removeDiscountCode().catch(() => null);
    if (confirmed) setCart(confirmed);
  };

  const cartHandles = new Set(cart?.lines.map((l) => l.merchandise.product.handle));
  const filteredFavs = favProducts.filter((p) => !cartHandles.has(p.handle));
  const hasItems = !!cart?.lines.length;
  const totalDiscount = (cart?.discountAllocations ?? []).reduce(
    (s, a) => s + parseFloat(a.discountedAmount.amount || "0"), 0,
  );

  return (
    <>
      <button
        type="button"
        aria-label="Open cart"
        onClick={openCart}
        className="tap-target rounded-md"
      >
        <OpenCart quantity={cart?.totalQuantity} />
      </button>

      <Transition show={isOpen}>
        <Dialog onClose={closeCart} className="relative z-50">
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 hidden bg-black/50 lg:block" aria-hidden="true" onClick={closeCart} />
          </Transition.Child>
          <div className="fixed inset-0 lg:hidden" onClick={closeCart} />

          {/* Panel */}
          <Transition.Child
            as={Fragment}
            enter="transition-transform ease-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed inset-y-0 right-0 flex h-full w-full flex-col bg-brand-dark text-white md:w-[400px] will-change-transform">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <ShoppingCartIcon className="h-5 w-5 text-brand-gold" />
                  <span className="font-heading font-semibold text-brand-gold tracking-wide">
                    My Cart
                  </span>
                  {cart?.totalQuantity ? (
                    <span className="ml-1 rounded-full bg-brand-gold/10 px-2 py-0.5 text-xs text-brand-gold">
                      {cart.totalQuantity}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={closeCart}
                  aria-label="Close cart"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white/40 hover:text-white transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col overflow-y-auto px-5">
                {!hasItems ? (
                  /* ── Empty state ── */
                  <div className="flex flex-1 flex-col">
                    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
                        <ShoppingCartIcon className="h-9 w-9 text-white/20" />
                      </div>
                      <div>
                        <p className="font-heading text-base uppercase tracking-widest text-white/60">
                          Your cart is empty
                        </p>
                        <p className="mt-1 text-sm text-white/30">
                          Add something from our collection.
                        </p>
                      </div>
                      <div className="flex w-full flex-col gap-2 pt-2">
                        <Link
                          href="/search/mens"
                          onClick={closeCart}
                          className="flex items-center justify-center rounded-full bg-brand-gold py-3 text-sm font-medium uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90"
                        >
                          Shop Mens
                        </Link>
                        <Link
                          href="/search"
                          onClick={closeCart}
                          className="flex items-center justify-center rounded-full border border-white/10 py-3 text-sm uppercase tracking-wider text-white/50 transition-colors hover:border-brand-gold/50 hover:text-white"
                        >
                          Browse All
                        </Link>
                      </div>
                    </div>
                    {filteredFavs.length > 0 && (
                      <FavoritesCarousel products={filteredFavs} onAdd={handleAddFav} onClose={closeCart} addingHandle={addingHandle} />
                    )}
                    <div className="pb-4" />
                  </div>
                ) : (
                  /* ── Has items ── */
                  <div className="flex flex-1 flex-col">
                    {/* Urgency nudge */}
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-brand-gold/5 px-3 py-2.5 border border-brand-gold/10">
                      <span className="text-brand-gold text-xs">🔱</span>
                      <p className="text-xs text-white/50">
                        items are <span className="text-white/70">not reserved</span> — checkout soon to secure yours.
                      </p>
                    </div>

                    {/* Cart lines */}
                    <ul className="mt-1">
                      {[...cart.lines]
                        .sort((a, b) => a.merchandise.product.title.localeCompare(b.merchandise.product.title))
                        .map((item) => (
                          <CartLineItem key={item.merchandise.id} item={item} />
                        ))}
                    </ul>

                    {/* Favorites */}
                    {filteredFavs.length > 0 && (
                      <FavoritesCarousel products={filteredFavs} onAdd={handleAddFav} onClose={closeCart} addingHandle={addingHandle} />
                    )}

                    {/* Spacer so content doesn't hide behind sticky footer */}
                    <div className="flex-1" />

                    {/* Discount code */}
                    <div className="pt-4 pb-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <TagIcon className="h-3.5 w-3.5 text-white/30" />
                        <span className="text-xs uppercase tracking-wider text-white/30">Discount</span>
                      </div>
                      {applyingDiscount ? (
                        <div className="flex items-center justify-center py-3 rounded-lg border border-white/5 bg-white/3">
                          <span className="text-xs text-white/40">Applying {appliedCode}…</span>
                        </div>
                      ) : appliedCode && discountConfirmed ? (
                        <div className="flex items-center justify-between rounded-lg border border-brand-gold/20 bg-brand-gold/5 px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <TagIcon className="h-3.5 w-3.5 text-brand-gold" />
                            <span className="text-sm text-brand-gold">{appliedCode}</span>
                            {totalDiscount > 0 && (
                              <span className="text-[10px] text-green-400 bg-green-500/10 rounded px-1.5 py-0.5">
                                −{new Intl.NumberFormat(undefined, { style: "currency", currency: cart.cost.totalAmount.currencyCode, currencyDisplay: "narrowSymbol" }).format(totalDiscount)}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={removeDiscount}
                            className="text-xs text-white/30 hover:text-red-400 transition-colors"
                          >
                            remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={discountInput}
                              onChange={(e) => { setDiscountInput(e.target.value); setDiscountError(""); }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  (e.target as HTMLInputElement).blur();
                                  applyDiscount(discountInput.trim());
                                }
                              }}
                              placeholder="Enter code"
                              enterKeyHint="done"
                              className="flex-1 rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-brand-gold/40 focus:outline-none"
                            />
                            <button
                              type="button"
                              disabled={!discountInput.trim() || applyingDiscount}
                              onClick={() => applyDiscount(discountInput.trim())}
                              className="rounded-lg border border-brand-gold/30 px-4 py-2.5 text-xs uppercase tracking-wider text-brand-gold transition-colors hover:bg-brand-gold/10 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              Apply
                            </button>
                          </div>
                          {discountError && (
                            <p className="mt-1.5 text-xs text-red-400">{discountError}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Summary */}
                    <div className="border-t border-white/5 pt-3 pb-2 space-y-2 text-sm">
                      <div className="flex items-center justify-between text-white/40">
                        <span>Subtotal</span>
                        <Price amount={cart.cost.subtotalAmount.amount} currencyCode={cart.cost.subtotalAmount.currencyCode} />
                      </div>
                      {totalDiscount > 0 && (
                        <div className="flex items-center justify-between text-green-400">
                          <span>Discount</span>
                          <span>
                            −{new Intl.NumberFormat(undefined, { style: "currency", currency: cart.cost.totalAmount.currencyCode, currencyDisplay: "narrowSymbol" }).format(totalDiscount)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-white/40">
                        <span>Shipping</span>
                        {freeShipping ? (
                          <span className="flex items-center gap-1.5 text-green-400">
                            Free
                            <span className="rounded bg-brand-gold/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-brand-gold">{tierName}</span>
                          </span>
                        ) : (
                          <span className="text-right text-xs">At checkout</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between border-t border-white/5 pt-2">
                        <span className="font-medium text-white">Total</span>
                        <Price
                          className="text-base font-semibold text-brand-gold"
                          amount={cart.cost.totalAmount.amount}
                          currencyCode={cart.cost.totalAmount.currencyCode}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkout footer — only when items exist */}
              {hasItems && (
                <div className="px-5 py-4 border-t border-white/5">
                  <form action={redirectToCheckout}>
                    <CheckoutButton />
                  </form>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}

function CheckoutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-brand-gold py-3.5 font-heading text-sm font-medium uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {!pending && (
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.15) 52%, transparent 70%)",
            animation: "cartShimmer 2s ease-in-out infinite",
          }}
        />
      )}
      {pending ? (
        <LoadingDots className="bg-brand-dark" />
      ) : (
        <span className="relative z-10 transition-all duration-300 group-hover:tracking-[0.2em]">
          Checkout Securely
        </span>
      )}
    </button>
  );
}
