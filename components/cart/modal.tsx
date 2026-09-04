"use client";

import {
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  TagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartOutlineIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import LoadingDots from "components/loading-dots";
import Price from "components/price";
import { DEFAULT_OPTION } from "lib/constants";
import type { CartItem, Product, ProductVariant } from "lib/shopify/types";
import { createUrl } from "lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createPortal } from "react-dom";
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

// Merge a Shopify-confirmed cart into local state without losing:
//   1. quantityAvailable — mutation responses sometimes return null even when the
//      initial fetch had a real inventory count
//   2. in-flight adds — items optimistically added (id===undefined) that Shopify
//      hasn't confirmed yet (e.g. a favorites add racing with a qty update)
function applyConfirmed(prev: import("lib/shopify/types").Cart | undefined, confirmed: import("lib/shopify/types").Cart): import("lib/shopify/types").Cart {
  if (!prev) return confirmed;

  // Iterate prev to decide WHICH items exist — confirmed is only consulted for
  // updated field values (id, merchandise data, quantityAvailable).
  //
  // Key insight: optimistic removes delete items from prev *before* any confirm
  // arrives, so a legitimately removed item is never present in prev when we get
  // here. Therefore the only case where an item is in prev-but-absent-from-confirmed
  // is a stale confirmed cart from a concurrent mutation that Shopify processed
  // before the item was added. We must keep it — dropping it is what causes the
  // rare "add from favorites bounces back" race.
  const lines: import("lib/shopify/types").CartItem[] = [];
  for (const prevLine of prev.lines) {
    const confirmedLine = confirmed.lines.find((l) => l.merchandise.id === prevLine.merchandise.id);
    if (confirmedLine) {
      // Use confirmed for id/merchandise, keep prev's qty and cost (may reflect a
      // more recent optimistic change that hasn't reached this confirm yet).
      const qa = confirmedLine.merchandise.quantityAvailable ?? prevLine.merchandise.quantityAvailable;
      lines.push({
        ...confirmedLine,
        quantity: prevLine.quantity,
        cost: prevLine.cost,
        merchandise: { ...confirmedLine.merchandise, quantityAvailable: qa },
      });
    } else {
      // Not in this confirmed cart — keep with prev data regardless of whether
      // it has a server id or not. Could be:
      //   - id=undefined: in-flight add awaiting its own confirm
      //   - real id: this confirm is stale; a faster confirm already gave it an id
      lines.push(prevLine);
    }
  }

  const subtotal = lines.reduce((s, l) => s + parseFloat(l.cost.totalAmount.amount), 0);
  // Scale the confirmed total proportionally rather than subtracting raw discount
  // allocations. confirmed's allocations may be stale (from a concurrent mutation
  // that raced Shopify) and were computed for a different line set. Proportional
  // scaling preserves the effective discount rate exactly for % codes and
  // approximates well for fixed-amount codes until the next confirm.
  const confirmedSubtotal = confirmed.lines.reduce((s, l) => s + parseFloat(l.cost.totalAmount.amount), 0);
  const confirmedTotal = parseFloat(confirmed.cost.totalAmount.amount);
  const total = confirmedSubtotal > 0
    ? Math.max(0, subtotal * (confirmedTotal / confirmedSubtotal))
    : subtotal;
  const cc = confirmed.cost.totalAmount.currencyCode;
  return {
    ...confirmed,
    lines,
    totalQuantity: lines.reduce((s, l) => s + l.quantity, 0),
    cost: {
      ...confirmed.cost,
      subtotalAmount: { amount: subtotal.toFixed(2), currencyCode: cc },
      totalAmount: { amount: total.toFixed(2), currencyCode: cc },
    },
  };
}

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
    const prevSubtotal = parseFloat(prev.cost.subtotalAmount.amount);
    const prevTotal = parseFloat(prev.cost.totalAmount.amount);
    const total = prevSubtotal > 0
      ? Math.max(0, subtotal * (prevTotal / prevSubtotal))
      : subtotal;
    const cc = prev.cost.totalAmount.currencyCode;
    return {
      ...prev,
      lines,
      totalQuantity: lines.reduce((s, l) => s + l.quantity, 0),
      cost: {
        ...prev.cost,
        subtotalAmount: { amount: subtotal.toFixed(2), currencyCode: cc },
        totalAmount: { amount: total.toFixed(2), currencyCode: cc },
      },
    };
  };

  const handleRemove = async () => {
    const snapshot = cart;
    // Optimistic: remove immediately so favorites carousel updates instantly.
    setCart((prev) => prev ? applyLines(prev, prev.lines.filter(l => l.merchandise.id !== item.merchandise.id)) : prev);
    try {
      const result = await removeItem(null, { lineItemId: item.id, merchandiseId: item.merchandise.id });
      if (result && typeof result === "object" && "cart" in result) {
        setCart((prev) => applyConfirmed(prev, result.cart));
      }
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
      if (result && typeof result === "object" && "cart" in result) {
        setCart((prev) => applyConfirmed(prev, result.cart));
      }
    } catch {
      setCart(snapshot);
    }
  };

  const stockLimit = typeof item.merchandise.quantityAvailable === "number" ? item.merchandise.quantityAvailable : 1;
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
              onClick={() => handleQty("plus")}
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
  loading,
  onAdd,
  onClose,
  addingHandle,
}: {
  products: FavProduct[];
  loading?: boolean;
  onAdd: (p: FavProduct) => void;
  onClose: () => void;
  addingHandle: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-3">
        <Link
          href="/favorites"
          onClick={onClose}
          className="flex items-center gap-1.5 group"
        >
          <HeartOutlineIcon className="h-3.5 w-3.5 text-brand-gold group-hover:hidden" />
          <HeartSolidIcon className="hidden h-3.5 w-3.5 text-brand-gold group-hover:block" />
          <span className="text-xs uppercase tracking-wider text-white/40 group-hover:text-brand-gold transition-colors">
            from your favorites
          </span>
        </Link>
      </div>
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ touchAction: "pan-x" }}>
        {loading && products.length === 0 && (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex-none w-[110px] rounded-lg border border-white/5 bg-white/3 p-1.5 animate-pulse">
                <div className="aspect-square w-full rounded-md bg-white/10 mb-1.5" />
                <div className="h-2.5 w-3/4 rounded bg-white/10 mb-1" />
                <div className="h-2.5 w-1/2 rounded bg-white/10" />
              </div>
            ))}
          </>
        )}
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
  const [favLoading, setFavLoading] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountConfirmed, setDiscountConfirmed] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);
  const [tierName, setTierName] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<string | null>(null);
  const favCacheRef = useRef<FavProduct[] | null>(null);
  const closedAtRef = useRef(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [modalMounted, setModalMounted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const openCart = useCallback(() => {
    if (Date.now() - closedAtRef.current < 500) return;
    setIsOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    closedAtRef.current = Date.now();
    setIsOpen(false);
  }, []);

  // Mount/unmount the modal DOM with enter/leave animation timing.
  // We manage this ourselves so we never use Headless UI's Dialog (which applies
  // overflow:hidden on the body and breaks sticky navbar positioning).
  useEffect(() => {
    if (isOpen) {
      setModalMounted(true);
      // Double-RAF: first RAF queues before paint; second fires after the
      // browser has actually rendered the initial state so the CSS transition
      // has a "from" frame to animate from.
      let raf1: number, raf2: number;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setModalVisible(true));
      });
      return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
    } else {
      setModalVisible(false);
      const t = setTimeout(() => setModalMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Keyboard: close on Escape — focus is intentionally NOT moved to the close
  // button on open because programmatic focus triggers the browser focus ring.

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, closeCart]);

  // Block page scroll while cart is open.
  // overflow:hidden on html is reliable (including iOS momentum scroll) and
  // doesn't break sticky navbar positioning the way body overflow:hidden does.
  useEffect(() => {
    if (!isOpen) return;

    document.documentElement.classList.add("drawer-open");
    document.body.classList.add("cart-open");
    const prevent = (e: WheelEvent | TouchEvent) => {
      const panel = document.querySelector("[data-cart-panel]");
      if (panel && panel.contains(e.target as Node)) return;
      e.preventDefault();
    };

    document.addEventListener("wheel", prevent, { passive: false });
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      document.documentElement.classList.remove("drawer-open");
      document.body.classList.remove("cart-open");
      document.removeEventListener("wheel", prevent);
      document.removeEventListener("touchmove", prevent);
    };
  }, [isOpen]);

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

  // Keep favorites carousel in sync when user adds/removes favorites elsewhere
  useEffect(() => {
    const handler = () => {
      try {
        const handles: string[] = JSON.parse(localStorage.getItem("atheles-favorites") || "[]");
        const handleSet = new Set(handles);
        const cached = favCacheRef.current ?? [];
        const cachedHandles = new Set(cached.map((p) => p.handle));

        // Remove unfavorited items
        const kept = cached.filter((p) => handleSet.has(p.handle));

        // Find newly added handles not yet in cache
        const newHandles = handles.filter((h) => !cachedHandles.has(h)).slice(0, 6);

        if (newHandles.length === 0) {
          favCacheRef.current = kept;
          setFavProducts(kept);
          return;
        }

        // Fetch newly added products and merge
        fetch("/api/products/by-handles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handles: newHandles }),
        })
          .then((r) => r.ok ? r.json() : { products: [] })
          .then((d) => {
            const merged = [...kept, ...(d.products ?? [])];
            favCacheRef.current = merged;
            setFavProducts(merged);
          })
          .catch(() => {
            favCacheRef.current = kept;
            setFavProducts(kept);
          });
      } catch {}
    };
    window.addEventListener("favorites-changed", handler);
    return () => window.removeEventListener("favorites-changed", handler);
  }, []);

  // Clear per-user cached data when account switches
  useEffect(() => {
    const handler = () => {
      // Clear user-keyed address cache so next user never sees stale data
      try {
        const session = localStorage.getItem("atheles-session");
        if (session) {
          const email = JSON.parse(session).email;
          if (email) localStorage.removeItem(`atheles-delivery-${email}`);
        }
      } catch {}
      favCacheRef.current = null;
      setFavProducts([]);
      setDeliveryAddress(null);
      setTierName(null);
      setFreeShipping(false);
      setAppliedCode(null);
      setDiscountConfirmed(false);
    };
    window.addEventListener("user-logout", handler);
    return () => window.removeEventListener("user-logout", handler);
  }, []);

  // Sync applied discount code from cart state whenever we don't already have
  // one locally. Runs on every discountCodes change so late-loading cart data
  // and confirmed carts are all caught.
  useEffect(() => {
    if (!isOpen || appliedCode) return;
    const active = cart?.discountCodes?.find((dc) => dc.applicable);
    if (active) { setAppliedCode(active.code); setDiscountConfirmed(true); }
  }, [isOpen, appliedCode, cart?.discountCodes]);

  // Confirm discount once the cost difference shows a real reduction
  // (uses cost delta so it works even when discountAllocations hasn't updated yet).
  useEffect(() => {
    if (!appliedCode || discountConfirmed || !cart) return;
    const hasDiscount = parseFloat(cart.cost.subtotalAmount.amount) > parseFloat(cart.cost.totalAmount.amount);
    if (hasDiscount) setDiscountConfirmed(true);
  }, [appliedCode, discountConfirmed, cart?.cost.subtotalAmount.amount, cart?.cost.totalAmount.amount]);

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

  // Load default delivery address — show user-keyed cache instantly, then refresh
  useEffect(() => {
    if (!isOpen) return;
    if (!document.cookie.includes("atheles-logged-in=1")) { setDeliveryAddress(null); return; }

    // Show cached address immediately only if it belongs to the current user
    let currentEmail: string | null = null;
    try {
      const session = localStorage.getItem("atheles-session");
      if (session) {
        currentEmail = JSON.parse(session).email ?? null;
        if (currentEmail) {
          const cached = localStorage.getItem(`atheles-delivery-${currentEmail}`);
          if (cached) setDeliveryAddress(cached);
        }
      }
    } catch {}

    fetch("/api/auth/addresses")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d?.addresses?.length) { setDeliveryAddress(null); return; }
        const def = d.addresses.find((a: { id: string }) => a.id === d.defaultAddressId) ?? d.addresses[0];
        const parts = [def.address1, def.zip].filter(Boolean);
        const addr = parts.join(", ");
        setDeliveryAddress(addr);
        try {
          if (currentEmail) localStorage.setItem(`atheles-delivery-${currentEmail}`, addr);
        } catch {}
      })
      .catch(() => {});
  }, [isOpen]);

  // Load favorites once per open
  useEffect(() => {
    if (!isOpen) return;
    if (favCacheRef.current) { setFavProducts(favCacheRef.current); return; }
    try {
      const handles: string[] = JSON.parse(localStorage.getItem("atheles-favorites") || "[]");
      if (!handles.length) { setFavProducts([]); setFavLoading(false); return; }
      setFavLoading(true);
      fetch("/api/products/by-handles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handles: handles.slice(0, 6) }),
      })
        .then((r) => r.ok ? r.json() : { products: [] })
        .then((d) => { const p = d.products || []; favCacheRef.current = p; setFavProducts(p); })
        .catch(() => {})
        .finally(() => setFavLoading(false));
    } catch { setFavProducts([]); setFavLoading(false); }
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
      priceRange: { maxVariantPrice: p.priceRange.maxVariantPrice, minVariantPrice: p.priceRange.maxVariantPrice },
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
        setCart((prev) => applyConfirmed(prev, result.cart));
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
        setCart((prev) => applyConfirmed(prev, result.cart!));
        setDiscountConfirmed(true);
      }
    } catch {
      setAppliedCode(null); setDiscountConfirmed(false);
      setDiscountError("failed to apply code.");
    }
    setApplyingDiscount(false);
  };

  const removeDiscount = async () => {
    setAppliedCode(null); setDiscountConfirmed(false);
    setDiscountInput(""); setDiscountError("");
    setCart((prev) => prev ? {
      ...prev,
      discountCodes: [],
      discountAllocations: [],
      cost: { ...prev.cost, totalAmount: { amount: prev.cost.subtotalAmount.amount, currencyCode: prev.cost.subtotalAmount.currencyCode } },
    } : prev);
    const confirmed = await removeDiscountCode().catch(() => null);
    if (confirmed) setCart((prev) => applyConfirmed(prev, confirmed));
  };

  const cartHandles = new Set(cart?.lines.map((l) => l.merchandise.product.handle));
  const filteredFavs = favProducts.filter((p) => !cartHandles.has(p.handle));
  const hasItems = !!cart?.lines.length;
  // Derive discount from the cost delta so it updates immediately with every
  // optimistic operation, rather than waiting for discountAllocations to settle.
  const totalDiscount = cart
    ? Math.max(0, parseFloat(cart.cost.subtotalAmount.amount) - parseFloat(cart.cost.totalAmount.amount))
    : 0;

  return (
    <>
      <button
        type="button"
        aria-label="Open cart"
        onClick={openCart}
        className="tap-target rounded-md outline-none"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <OpenCart quantity={cart?.totalQuantity} />
      </button>

      {modalMounted && createPortal(
        <>
          {/* Backdrop — z-[65] covers the navbar (z-[60]) so it dims with the rest of the page */}
          <div
            className={`fixed inset-0 z-[65] bg-black/50 transition-opacity duration-300 ${modalVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            aria-hidden="true"
            onClick={closeCart}
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className={`fixed inset-x-0 right-0 top-0 flex h-dvh w-full flex-col bg-brand-dark text-white md:left-auto md:w-[400px] will-change-transform border-l border-brand-dark-gold/20 z-[70] transition-transform duration-300 ease-out ${modalVisible ? "translate-x-0" : "translate-x-full"}`}
            style={{ overscrollBehavior: "contain" }}
          >

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
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeCart}
                  aria-label="Close cart"
                  className="flex h-9 w-9 items-center justify-center text-white/40 hover:text-white transition-colors outline-none"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Delivering to */}
              {deliveryAddress && (
                <Link
                  href="/profile"
                  onClick={closeCart}
                  className="group flex items-center gap-2 border-b border-brand-dark-gold/15 px-5 py-2.5 transition-colors hover:bg-brand-dark-gold/5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 flex-none text-brand-gold/60">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span className="min-w-0 flex-1 truncate text-xs text-brand-grey/60">
                    delivering to <span className="text-brand-pale-gold">{deliveryAddress}</span>
                  </span>
                  <span className="flex-none whitespace-nowrap text-[10px] text-brand-grey/40 transition-colors group-hover:text-brand-gold">change</span>
                </Link>
              )}

              {/* Body */}
              <div data-cart-panel className="flex flex-1 flex-col overflow-y-auto px-5" style={{ overscrollBehavior: "contain" }}>
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
                  </div>
                ) : (
                  /* ── Has items ── */
                  <div className="flex flex-1 flex-col">
                    {/* Urgency nudge */}
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-brand-gold/5 px-3 py-2.5 border border-brand-gold/10">
                      <p className="text-xs text-white/50">
                        items are not reserved 🔱 checkout soon to secure yours.
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

                    {/* Spacer so content doesn't hide behind sticky footer */}
                    <div className="flex-1" />

                    {/* Discount code */}
                    <div className="pt-4 pb-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <TagIcon className="h-3.5 w-3.5 text-white/30" />
                        <span className="text-xs uppercase tracking-wider text-white/30">Discount</span>
                      </div>
                      {appliedCode && discountConfirmed ? (
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
                              value={applyingDiscount ? (appliedCode ?? discountInput) : discountInput}
                              onChange={(e) => { if (!applyingDiscount) { setDiscountInput(e.target.value); setDiscountError(""); } }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !applyingDiscount) {
                                  e.preventDefault();
                                  (e.target as HTMLInputElement).blur();
                                  applyDiscount(discountInput.trim());
                                }
                              }}
                              placeholder="enter code"
                              enterKeyHint="done"
                              disabled={applyingDiscount}
                              className="flex-1 rounded-lg border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:border-brand-gold/40 focus:outline-none disabled:opacity-60"
                            />
                            <button
                              type="button"
                              disabled={(!discountInput.trim() && !applyingDiscount) || applyingDiscount}
                              onClick={() => !applyingDiscount && applyDiscount(discountInput.trim())}
                              className="min-w-[64px] flex items-center justify-center rounded-lg border border-brand-gold/30 px-4 py-2.5 text-xs uppercase tracking-wider text-brand-gold transition-colors hover:bg-brand-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {applyingDiscount ? <LoadingDots className="bg-brand-gold" /> : "Apply"}
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

              {/* Favorites — outside the scroll body so it never causes vertical scroll */}
              {(favLoading || filteredFavs.length > 0) && (
                <div className="border-t border-white/5 px-5">
                  <FavoritesCarousel products={filteredFavs} loading={favLoading} onAdd={handleAddFav} onClose={closeCart} addingHandle={addingHandle} />
                </div>
              )}

              {/* Checkout footer — only when items exist */}
              {hasItems && (
                <div className="px-5 py-4 border-t border-white/5">
                  <form action={redirectToCheckout}>
                    <CheckoutButton />
                  </form>
                </div>
              )}
          </div>
        </>,
        document.body
      )}
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
