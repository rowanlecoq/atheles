"use client";

import clsx from "clsx";
import { Dialog, Transition } from "@headlessui/react";
import {
  ShoppingCartIcon,
  XMarkIcon,
  HeartIcon as HeartOutlineIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import LoadingDots from "components/loading-dots";
import Price from "components/price";
import { DEFAULT_OPTION } from "lib/constants";
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
} from "./actions";
import { useCart } from "./cart-context";
import { DeleteItemButton } from "./delete-item-button";
import { EditItemQuantityButton } from "./edit-item-quantity-button";
import OpenCart from "./open-cart";

type MerchandiseSearchParams = {
  [key: string]: string;
};

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

function FavoritesCarousel({
  products,
  onAdd,
  onClose,
}: {
  products: FavProduct[];
  onAdd: (handle: string, variantId: string) => void;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [checkScroll, products.length]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -144 : 144, behavior: "smooth" });
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Link
          href="/favorites"
          onClick={onClose}
          className="group flex items-center gap-1.5"
        >
          <HeartOutlineIcon className="h-3.5 w-3.5 text-brand-gold group-hover:hidden" />
          <HeartSolidIcon className="hidden h-3.5 w-3.5 text-brand-gold group-hover:block" />
          <p className="text-xs uppercase tracking-wider text-brand-grey transition-colors group-hover:text-brand-gold">
            from your favorites
          </p>
        </Link>
        {/* Desktop scroll arrows — hidden on mobile where touch scrolling works */}
        <div className="hidden items-center gap-1 md:flex">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll favorites left"
            className="flex h-6 w-6 items-center justify-center rounded border border-brand-dark-gold/20 text-brand-grey transition-colors hover:border-brand-gold/40 hover:text-brand-gold disabled:pointer-events-none disabled:opacity-20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll favorites right"
            className="flex h-6 w-6 items-center justify-center rounded border border-brand-dark-gold/20 text-brand-grey transition-colors hover:border-brand-gold/40 hover:text-brand-gold disabled:pointer-events-none disabled:opacity-20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {products.map((p) => {
          const canAdd = !!p.firstVariantId && !!p.availableForSale;
          return (
            <div
              key={p.handle}
              className="group/card flex w-[130px] flex-none flex-col rounded-lg border border-brand-dark-gold/15 bg-brand-dark-gold/5 p-2 transition-colors hover:border-brand-gold/30"
            >
              {canAdd ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!p.firstVariantId) return;
                    onAdd(p.handle, p.firstVariantId);
                  }}
                  className="text-left"
                >
                  <div className="relative mb-1.5 aspect-square w-full overflow-hidden rounded">
                    {p.featuredImage?.url ? (
                      <Image src={p.featuredImage.url} alt={p.title} fill priority className="object-cover" sizes="130px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-medium-grey/20">
                        <span className="text-[8px] text-brand-grey">ATHELES</span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/0 transition-colors group-hover/card:bg-brand-dark/40">
                      <span className="text-xs font-medium uppercase tracking-wider text-white opacity-0 transition-opacity group-hover/card:opacity-100">
                        + add
                      </span>
                    </div>
                  </div>
                  <p className="truncate text-[10px] text-white group-hover/card:text-brand-gold">{p.title}</p>
                </button>
              ) : (
                <div>
                  <div className="relative mb-1.5 aspect-square w-full overflow-hidden rounded">
                    {p.featuredImage?.url ? (
                      <Image src={p.featuredImage.url} alt={p.title} fill priority className="object-cover opacity-50" sizes="130px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-medium-grey/20">
                        <span className="text-[8px] text-brand-grey">ATHELES</span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] uppercase tracking-wider text-red-400">sold out</span>
                    </div>
                  </div>
                  <p className="truncate text-[10px] text-white/50">{p.title}</p>
                </div>
              )}
              <div className="mt-1 flex items-center justify-between">
                <Price
                  className="text-[10px] text-brand-grey"
                  amount={p.priceRange.maxVariantPrice.amount}
                  currencyCode={p.priceRange.maxVariantPrice.currencyCode}
                />
                <Link
                  href={`/product/${p.handle}`}
                  onClick={onClose}
                  className="text-[10px] text-brand-gold transition-colors hover:text-brand-pale-gold"
                >
                  view
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CartModal() {
  const { cart, updateCartItem, clearDiscount, clearItemPatch, setServerCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [favProducts, setFavProducts] = useState<FavProduct[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [appliedCodeLocal, setAppliedCodeLocal] = useState<string | null>(null);
  const [discountConfirmed, setDiscountConfirmed] = useState(false);
  const discountSyncedRef = useRef(false);
  const [freeShipping, setFreeShipping] = useState(false);
  const [tierName, setTierName] = useState<string | null>(null);
  const favCacheRef = useRef<{ products: FavProduct[] } | null>(null);
  const closedAtRef = useRef(0);
  const openCart = () => {
    if (Date.now() - closedAtRef.current < 500) return;
    setIsOpen(true);
  };
  const closeCart = () => {
    closedAtRef.current = Date.now();
    setIsOpen(false);
  };

  const handleAddFav = useCallback((handle: string, variantId: string) => {
    const favProduct = favProducts.find((p) => p.handle === handle);
    if (favProduct?.firstVariantId) {
      const vid = favProduct.firstVariantId;
      // Clear any stale delete sentinel so the optimistic add is immediately visible
      clearItemPatch(vid);
      const price = favProduct.firstVariantPrice ?? favProduct.priceRange.maxVariantPrice;
      setServerCart((prev) => {
        const base = prev ?? {
          id: undefined,
          checkoutUrl: "",
          totalQuantity: 0,
          lines: [] as NonNullable<typeof prev>["lines"],
          cost: {
            subtotalAmount: { amount: "0", currencyCode: price.currencyCode },
            totalAmount: { amount: "0", currencyCode: price.currencyCode },
            totalTaxAmount: { amount: "0", currencyCode: price.currencyCode },
          },
          discountCodes: [],
          discountAllocations: [],
        } as NonNullable<typeof prev>;
        const existing = base.lines.find((l) => l.merchandise.id === vid);
        const qty = (existing?.quantity ?? 0) + 1;
        const itemTotal = (parseFloat(price.amount) * qty).toFixed(2);
        const newLine = {
          id: existing?.id,
          quantity: qty,
          cost: { totalAmount: { amount: itemTotal, currencyCode: price.currencyCode } },
          merchandise: {
            id: vid,
            title: favProduct.firstVariantTitle ?? "Default Title",
            selectedOptions: favProduct.firstVariantOptions ?? [],
            product: {
              id: favProduct.id ?? "",
              handle: favProduct.handle,
              title: favProduct.title,
              featuredImage: favProduct.featuredImage
                ? { url: favProduct.featuredImage.url, altText: "" }
                : { url: "", altText: "" },
            },
          },
        } as typeof base.lines[number];
        const lines = existing
          ? base.lines.map((l) => (l.merchandise.id === vid ? newLine : l))
          : [...base.lines, newLine];
        const subtotal = lines.reduce((s, l) => s + parseFloat(l.cost.totalAmount.amount), 0);
        // Preserve the existing discount in the optimistic total so the displayed
        // price doesn't jump to the full undiscounted amount while the server confirms.
        const prevSubtotal = parseFloat(base.cost.subtotalAmount.amount);
        const prevDiscount = Math.max(0, prevSubtotal - parseFloat(base.cost.totalAmount.amount));
        const newTotal = Math.max(0, subtotal - prevDiscount);
        return {
          ...base,
          lines,
          totalQuantity: lines.reduce((s, l) => s + l.quantity, 0),
          cost: {
            ...base.cost,
            subtotalAmount: { amount: subtotal.toFixed(2), currencyCode: price.currencyCode },
            totalAmount: { amount: newTotal.toFixed(2), currencyCode: price.currencyCode },
          },
        };
      });
    }
    addItem(null, variantId).then((result) => {
      if (result && typeof result === "object" && "cart" in result) {
        const confirmed = result.cart;
        setServerCart((prev) => {
          if (!prev) return confirmed;
          // Merge: update/add items from the confirmed result while keeping
          // any other optimistic lines that are still in-flight (concurrent adds).
          const mergedLines = prev.lines.map((prevLine) => {
            const confirmedLine = confirmed.lines.find(
              (l) => l.merchandise.id === prevLine.merchandise.id,
            );
            return confirmedLine ?? prevLine;
          });
          for (const confirmedLine of confirmed.lines) {
            if (!mergedLines.some((l) => l.merchandise.id === confirmedLine.merchandise.id)) {
              mergedLines.push(confirmedLine);
            }
          }
          const subtotal = mergedLines.reduce(
            (s, l) => s + parseFloat(l.cost.totalAmount.amount), 0,
          );
          const currencyCode = confirmed.cost.totalAmount.currencyCode;
          // Subtract Shopify-confirmed discount allocations so the merged total
          // stays accurate even when mergedLines includes in-flight optimistic items.
          const confirmedDiscount = (confirmed.discountAllocations ?? []).reduce(
            (sum, a) => sum + parseFloat(a.discountedAmount.amount), 0,
          );
          const mergedTotal = Math.max(0, subtotal - confirmedDiscount);
          return {
            ...confirmed,
            lines: mergedLines,
            totalQuantity: mergedLines.reduce((s, l) => s + l.quantity, 0),
            cost: {
              ...confirmed.cost,
              subtotalAmount: { amount: subtotal.toFixed(2), currencyCode },
              totalAmount: { amount: mergedTotal.toFixed(2), currencyCode },
            },
          };
        });
      }
    }).catch(() => {});
  }, [favProducts, clearItemPatch, setServerCart]);

  useEffect(() => {
    if (!cart) {
      createCartAndSetCookie();
    }
  }, [cart]);

  // Listen for custom open-cart events (from quick-add etc.)
  useEffect(() => {
    const handleOpenCart = () => setIsOpen(true);
    window.addEventListener("open-cart", handleOpenCart);
    return () => window.removeEventListener("open-cart", handleOpenCart);
  }, []);

  // Mirror optimistic add-to-cart from product pages into this cart instance.
  // Uses setServerCart directly (not addCartItem/useOptimistic) so there is no
  // pending action to re-apply when the confirmed cart arrives — preventing the
  // qty=2 flash that occurred when useOptimistic re-applied ADD_ITEM on top of
  // the already-confirmed serverCart.
  useEffect(() => {
    const handleOptimisticAdd = (e: Event) => {
      const { variant, product } = (e as CustomEvent).detail;
      clearItemPatch(variant.id);
      setServerCart((prev) => {
        const base = prev ?? {
          id: undefined,
          checkoutUrl: "",
          totalQuantity: 0,
          lines: [] as NonNullable<typeof prev>["lines"],
          cost: {
            subtotalAmount: { amount: "0", currencyCode: variant.price.currencyCode },
            totalAmount: { amount: "0", currencyCode: variant.price.currencyCode },
            totalTaxAmount: { amount: "0", currencyCode: variant.price.currencyCode },
          },
          discountCodes: [],
          discountAllocations: [],
        } as NonNullable<typeof prev>;
        const existing = base.lines.find((l) => l.merchandise.id === variant.id);
        const qty = (existing?.quantity ?? 0) + 1;
        const itemTotal = (parseFloat(variant.price.amount) * qty).toFixed(2);
        const newLine = {
          id: existing?.id,
          quantity: qty,
          cost: { totalAmount: { amount: itemTotal, currencyCode: variant.price.currencyCode } },
          merchandise: {
            id: variant.id,
            title: variant.title,
            selectedOptions: variant.selectedOptions,
            product: {
              id: product.id,
              handle: product.handle,
              title: product.title,
              featuredImage: product.featuredImage,
            },
          },
        } as typeof base.lines[number];
        const lines = existing
          ? base.lines.map((l) => (l.merchandise.id === variant.id ? newLine : l))
          : [...base.lines, newLine];
        const subtotal = lines.reduce((s, l) => s + parseFloat(l.cost.totalAmount.amount), 0);
        const prevSubtotal = parseFloat(base.cost.subtotalAmount.amount);
        const prevDiscount = Math.max(0, prevSubtotal - parseFloat(base.cost.totalAmount.amount));
        const newTotal = Math.max(0, subtotal - prevDiscount);
        return {
          ...base,
          lines,
          totalQuantity: lines.reduce((s, l) => s + l.quantity, 0),
          cost: {
            ...base.cost,
            subtotalAmount: { amount: subtotal.toFixed(2), currencyCode: variant.price.currencyCode },
            totalAmount: { amount: newTotal.toFixed(2), currencyCode: variant.price.currencyCode },
          },
        };
      });
    };
    window.addEventListener("cart:add-optimistic", handleOptimisticAdd);
    return () => window.removeEventListener("cart:add-optimistic", handleOptimisticAdd);
  }, [clearItemPatch, setServerCart]);

  // Sync applied discount code from cart on first open only
  useEffect(() => {
    if (!isOpen) {
      discountSyncedRef.current = false;
      return;
    }
    if (discountSyncedRef.current) return;
    discountSyncedRef.current = true;
    const fromCart = cart?.discountCodes?.find((dc) => dc.applicable);
    const hasDiscount = (cart?.discountAllocations?.reduce(
      (sum, a) => sum + parseFloat(a.discountedAmount?.amount || "0"), 0
    ) || 0) > 0;
    if (fromCart && hasDiscount) {
      setAppliedCodeLocal(fromCart.code);
      setDiscountConfirmed(true);
    }
  }, [isOpen, cart?.discountCodes, cart?.discountAllocations]);

  // Watch for cart discount to confirm after optimistic apply
  useEffect(() => {
    if (!appliedCodeLocal || discountConfirmed) return;
    const hasDiscount = (cart?.discountAllocations?.reduce(
      (sum, a) => sum + parseFloat(a.discountedAmount?.amount || "0"), 0
    ) || 0) > 0;
    if (hasDiscount) setDiscountConfirmed(true);
  }, [appliedCodeLocal, discountConfirmed, cart?.discountAllocations]);

  // Check user tier for free shipping
  useEffect(() => {
    if (!isOpen) return;
    if (!document.cookie.includes("atheles-logged-in=1")) {
      setFreeShipping(false);
      setTierName(null);
      return;
    }
    const applyTier = (totalSpent: string, isAthlete?: boolean) => {
      if (isAthlete) {
        setTierName("ATHLETE");
        setFreeShipping(true);
        return;
      }
      const points = Math.floor(parseFloat(totalSpent || "0") * 50);
      const tier = points >= 50000 ? "CHAMPION" : points >= 30000 ? "PLATINUM" : points >= 15000 ? "GOLD" : points >= 5000 ? "SILVER" : "BRONZE";
      setTierName(tier);
      setFreeShipping(tier === "CHAMPION");
    };
    // Try cache first
    try {
      const cached = localStorage.getItem("atheles-session");
      if (cached) {
        const u = JSON.parse(cached);
        applyTier(u.totalSpent, u.isAthlete);
        return;
      }
    } catch {}
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) {
          applyTier(data.user.totalSpent, data.user.isAthlete);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Load favorited products once when cart opens
  useEffect(() => {
    if (!isOpen) return;
    // Use cache if already loaded this session
    if (favCacheRef.current) {
      setFavProducts(favCacheRef.current.products);
      return;
    }
    try {
      const stored = localStorage.getItem("atheles-favorites");
      const favHandles: string[] = stored ? JSON.parse(stored) : [];
      if (favHandles.length === 0) {
        setFavProducts([]);
        return;
      }
      const limited = favHandles.slice(0, 6);
      fetch("/api/products/by-handles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handles: limited }),
      })
        .then((r) => (r.ok ? r.json() : { products: [] }))
        .then((d) => {
          const products = d.products || [];
          favCacheRef.current = { products };
          setFavProducts(products);
        })
        .catch(() => {});
    } catch {
      setFavProducts([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const hasItems = cart && cart.lines.length > 0;

  // Filter out favorites that are already in the cart
  const cartHandles = new Set(cart?.lines.map((line) => line.merchandise.product.handle) || []);
  const filteredFavProducts = favProducts.filter((p) => !cartHandles.has(p.handle));

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
          {/* Desktop backdrop — subtle dark overlay that animates with the cart, click to close */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-in-out duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="fixed inset-0 hidden bg-black/30 lg:block"
              aria-hidden="true"
              onClick={closeCart}
            />
          </Transition.Child>
          {/* Mobile: transparent click-outside (panel is full-width so rarely hit, but keeps Dialog functional) */}
          <div className="fixed inset-0 lg:hidden" onClick={closeCart} />
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed bottom-0 right-0 top-0 flex h-full w-full flex-col overflow-y-auto border-l border-brand-dark-gold/30 bg-brand-dark p-4 text-white sm:p-6 md:w-[390px] will-change-transform">
              {/* Header */}
              <div className="flex items-center justify-between">
                <p className="font-heading text-lg font-semibold text-brand-gold">
                  My Cart
                </p>
                <button
                  type="button"
                  aria-label="Close cart"
                  onClick={closeCart}
                >
                  <CloseCart />
                </button>
              </div>

              {!hasItems ? (
                <div className="flex h-full flex-col">
                  {/* Empty state */}
                  <div className="flex flex-1 flex-col items-center justify-center px-4">
                    {/* Shopping bag icon */}
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-brand-dark-gold/10">
                      <ShoppingCartIcon className="h-12 w-12 text-brand-grey/60" />
                    </div>
                    <p className="font-heading text-lg uppercase tracking-wider text-brand-pale-gold">
                      your cart is currently empty.
                    </p>
                    <p className="mt-2 text-sm text-brand-grey">
                      explore our collection and find something you love.
                    </p>

                    {/* Quick shop links */}
                    <div className="mt-6 flex w-full flex-col gap-2.5">
                      <Link
                        href="/search/mens"
                        onClick={closeCart}
                        className="flex min-h-[44px] items-center justify-center rounded-full bg-brand-gold px-6 py-3 text-center text-sm font-medium uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90"
                      >
                        shop mens
                      </Link>
                      <Link
                        href="/search"
                        onClick={closeCart}
                        className="flex min-h-[44px] items-center justify-center rounded-full border border-brand-dark-gold/30 px-6 py-3 text-center text-sm uppercase tracking-wider text-brand-grey transition-colors hover:border-brand-gold hover:text-brand-gold"
                      >
                        browse all
                      </Link>
                    </div>
                  </div>

                  {/* Favorites section in empty cart too */}
                  {filteredFavProducts.length > 0 && (
                    <div className="mt-2 border-t border-brand-dark-gold/20 px-1 pb-4 pt-5">
                      <FavoritesCarousel
                        products={filteredFavProducts}
                        onAdd={handleAddFav}
                        onClose={closeCart}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  {/* Urgency nudge */}
                  <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-brand-dark-gold/15 bg-brand-dark-gold/5 px-3.5 py-2.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 flex-none text-brand-gold">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs leading-relaxed text-brand-grey">
                      items are not reserved 🔱 checkout soon to secure yours.
                    </p>
                  </div>

                  {/* Cart items */}
                  <ul className="mt-3 grow">
                    {cart.lines
                      .sort((a, b) =>
                        a.merchandise.product.title.localeCompare(
                          b.merchandise.product.title,
                        ),
                      )
                      .map((item) => {
                        const merchandiseSearchParams =
                          {} as MerchandiseSearchParams;

                        item.merchandise.selectedOptions.forEach(
                          ({ name, value }) => {
                            if (value !== DEFAULT_OPTION) {
                              merchandiseSearchParams[name.toLowerCase()] =
                                value;
                            }
                          },
                        );

                        const merchandiseUrl = createUrl(
                          `/product/${item.merchandise.product.handle}`,
                          new URLSearchParams(merchandiseSearchParams),
                        );

                        return (
                          <li
                            key={item.merchandise.id}
                            className="flex w-full flex-col border-b border-brand-dark-gold/20"
                          >
                            <div className="relative flex w-full flex-row justify-between gap-3 py-4 pl-14 pr-1">
                              <div className="absolute left-0 top-1/2 z-40 -translate-y-1/2">
                                <DeleteItemButton
                                  item={item}
                                  optimisticUpdate={updateCartItem}
                                />
                              </div>
                              <div className="flex min-w-0 flex-row">
                                <div className="relative h-16 w-16 overflow-hidden rounded-md border border-brand-dark-gold/20 bg-brand-medium-grey/30">
                                  <Image
                                    className="h-full w-full object-cover"
                                    width={64}
                                    height={64}
                                    priority
                                    alt={
                                      item.merchandise.product.featuredImage
                                        .altText ||
                                      item.merchandise.product.title
                                    }
                                    src={
                                      item.merchandise.product.featuredImage.url
                                    }
                                  />
                                </div>
                                <a
                                  href={merchandiseUrl}
                                  onClick={closeCart}
                                  className="z-30 ml-3 flex min-w-0 flex-row"
                                >
                                  <div className="flex min-w-0 flex-1 flex-col text-base">
                                    <span className="line-clamp-2 text-sm leading-tight">
                                      {item.merchandise.product.title}
                                    </span>
                                    {item.merchandise.title !==
                                    DEFAULT_OPTION ? (
                                      <p className="line-clamp-1 text-xs text-brand-grey">
                                        {item.merchandise.title}
                                      </p>
                                    ) : null}
                                  </div>
                                </a>
                              </div>
                              <div className="flex h-16 flex-col justify-between">
                                <Price
                                  className="flex justify-end space-y-2 text-right text-sm"
                                  amount={item.cost.totalAmount.amount}
                                  currencyCode={
                                    item.cost.totalAmount.currencyCode
                                  }
                                />
                                <div className="ml-auto flex h-9 flex-row items-center rounded-full border border-brand-dark-gold/30">
                                  <EditItemQuantityButton
                                    item={item}
                                    type="minus"
                                    optimisticUpdate={updateCartItem}
                                  />
                                  <p className="w-6 text-center">
                                    <span className="w-full text-xs">
                                      {item.quantity}
                                    </span>
                                  </p>
                                  <EditItemQuantityButton
                                    item={item}
                                    type="plus"
                                    optimisticUpdate={updateCartItem}
                                  />
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                  </ul>

                  {/* Favorites section */}
                  {filteredFavProducts.length > 0 && (
                    <div className="border-t border-brand-dark-gold/20 pt-3">
                      <FavoritesCarousel
                        products={filteredFavProducts}
                        onAdd={handleAddFav}
                        onClose={closeCart}
                      />
                    </div>
                  )}

                  {/* Discount code */}
                  {(() => {
                    const appliedCode = appliedCodeLocal && discountConfirmed ? { code: appliedCodeLocal, applicable: true } : null;
                    const pendingCode = appliedCodeLocal && !discountConfirmed;
                    const totalDiscount = cart.discountAllocations?.reduce(
                      (sum, a) => sum + parseFloat(a.discountedAmount.amount || "0"), 0
                    ) || 0;
                    const subtotal = parseFloat(cart.cost.subtotalAmount.amount);
                    const hasDiscount = !!appliedCode && totalDiscount > 0;

                    return (
                      <div className="pt-2">
                        <div className="mb-2 flex items-center gap-1.5">
                          <TagIcon className="h-3.5 w-3.5 text-brand-gold" />
                          <p className="text-xs uppercase tracking-wider text-brand-grey">
                            discount code
                          </p>
                        </div>
                        {pendingCode ? (
                          <div className="flex items-center justify-center rounded-lg border border-brand-dark-gold/20 px-3 py-3">
                            <span className="text-xs text-brand-grey">applying {appliedCodeLocal}...</span>
                          </div>
                        ) : appliedCode ? (
                          <div className="flex items-center justify-between rounded-lg border border-brand-gold/30 bg-brand-gold/5 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-brand-gold">{appliedCode.code}</span>
                              {totalDiscount > 0 ? (
                                <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400">
                                  -{new Intl.NumberFormat(undefined, { style: "currency", currency: cart.cost.totalAmount.currencyCode, currencyDisplay: "narrowSymbol" }).format(totalDiscount)} off
                                </span>
                              ) : (
                                <span className="rounded bg-brand-gold/10 px-1.5 py-0.5 text-[10px] text-brand-gold">
                                  applies at checkout
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAppliedCodeLocal(null);
                                setDiscountConfirmed(false);
                                setDiscountCode("");
                                setDiscountError("");
                                // Optimistically zero out the discount so total
                                // updates instantly without waiting for Shopify.
                                clearDiscount();
                                removeDiscountCode().then((confirmedCart) => {
                                  if (confirmedCart) setServerCart(confirmedCart);
                                }).catch(() => {});
                              }}
                              className="text-xs text-brand-grey hover:text-red-400"
                            >
                              remove
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={discountCode}
                                onChange={(e) => {
                                  setDiscountCode(e.target.value);
                                  setDiscountError("");
                                }}
                                placeholder="Enter code"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && discountCode.trim() && !applyingDiscount) {
                                    e.preventDefault();
                                    (e.target as HTMLInputElement).blur();
                                    const code = discountCode.trim();
                                    setDiscountError("");
                                    setApplyingDiscount(true);
                                    setAppliedCodeLocal(code);
                                    setDiscountCode("");
                                    applyDiscountCode(code).then((result) => {
                                      if (!result.success) {
                                        setAppliedCodeLocal(null); setDiscountConfirmed(false);
                                        setDiscountError(result.error || "failed to apply code.");
                                      } else if (!result.applicable) {
                                        setAppliedCodeLocal(null); setDiscountConfirmed(false);
                                        setDiscountError("invalid or expired code.");
                                        removeDiscountCode().catch(() => {});
                                      } else if (result.cart) {
                                        // Use the returned cart immediately — no need to wait
                                        // for the next cartPromise refresh cycle.
                                        setServerCart(result.cart);
                                        setDiscountConfirmed(true);
                                      }
                                    }).catch(() => {
                                      setAppliedCodeLocal(null); setDiscountConfirmed(false);
                                      setDiscountError("failed to apply code.");
                                    }).finally(() => setApplyingDiscount(false));
                                  }
                                }}
                                enterKeyHint="done"
                                className="flex-1 rounded-lg border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-base text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
                              />
                              <button
                                type="button"
                                disabled={!discountCode.trim() || applyingDiscount}
                                onClick={() => {
                                  const code = discountCode.trim();
                                  if (!code || applyingDiscount) return;
                                  setDiscountError("");
                                  setApplyingDiscount(true);
                                  setAppliedCodeLocal(code);
                                  setDiscountCode("");
                                  applyDiscountCode(code).then((result) => {
                                    if (!result.success) {
                                      setAppliedCodeLocal(null); setDiscountConfirmed(false);
                                      setDiscountError(result.error || "failed to apply code.");
                                    } else if (!result.applicable) {
                                      setAppliedCodeLocal(null); setDiscountConfirmed(false);
                                      setDiscountError("invalid or expired code.");
                                      removeDiscountCode().catch(() => {});
                                    } else if (result.cart) {
                                      setServerCart(result.cart);
                                      setDiscountConfirmed(true);
                                    }
                                  }).catch(() => {
                                    setAppliedCodeLocal(null); setDiscountConfirmed(false);
                                    setDiscountError("failed to apply code.");
                                  }).finally(() => setApplyingDiscount(false));
                                }}
                                className="rounded-lg border border-brand-gold/40 px-4 py-2 text-xs uppercase tracking-wider text-brand-gold transition-colors hover:bg-brand-gold/10 disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                {applyingDiscount ? "..." : "apply"}
                              </button>
                            </div>
                            {discountError && (
                              <p className="mt-1.5 text-xs text-red-400">{discountError}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Summary */}
                  <div className="pt-3 text-sm text-brand-grey">
                    <div className="mb-2 flex items-center justify-between">
                      <p>Shipping</p>
                      {freeShipping ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-green-400">Free</span>
                          <span className="rounded bg-brand-gold/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-brand-gold">
                            {tierName}
                          </span>
                        </div>
                      ) : (
                        <p className="text-right text-xs">Calculated at checkout</p>
                      )}
                    </div>
                    <div className="mb-3 flex items-center justify-between border-t border-brand-dark-gold/20 pt-2">
                      <p className="font-medium text-white">Total</p>
                      <Price
                        className="text-right text-base font-medium text-brand-gold"
                        amount={cart.cost.totalAmount.amount}
                        currencyCode={cart.cost.totalAmount.currencyCode}
                      />
                    </div>
                  </div>

                  {/* Checkout button */}
                  <form action={redirectToCheckout} className="pb-1">
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

function CloseCart({ className }: { className?: string }) {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center rounded-md text-brand-grey transition-colors hover:text-brand-gold">
      <XMarkIcon
        className={clsx(
          "h-6 w-6 transition-colors",
          className,
        )}
      />
    </div>
  );
}

function CheckoutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="group tap-target relative flex min-h-[44px] w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-brand-gold p-3 text-center font-heading text-sm font-medium uppercase text-brand-dark"
      type="submit"
      disabled={pending}
    >
      {!pending && (
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.15) 48%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.15) 52%, transparent 70%)",
            animation: "cartShimmer 2s ease-in-out infinite",
          }}
        />
      )}
      {pending ? (
        <LoadingDots className="bg-brand-dark" />
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="relative z-10 h-4 w-4 flex-none">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
          </svg>
          <span className="relative z-10 tracking-wider transition-all duration-300 group-hover:tracking-[0.2em]">
            Checkout Securely
          </span>
        </>
      )}
    </button>
  );
}
