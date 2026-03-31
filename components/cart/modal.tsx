"use client";

import clsx from "clsx";
import { Dialog, Transition } from "@headlessui/react";
import {
  ShoppingCartIcon,
  XMarkIcon,
  HeartIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import LoadingDots from "components/loading-dots";
import Price from "components/price";
import { DEFAULT_OPTION } from "lib/constants";
import { createUrl } from "lib/utils";
import Image from "next/image";
import { Fragment, useEffect, useRef, useState } from "react";
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
  handle: string;
  title: string;
  featuredImage?: { url: string } | null;
  priceRange: { maxVariantPrice: { amount: string; currencyCode: string } };
  firstVariantId?: string | null;
  availableForSale?: boolean;
};

export default function CartModal() {
  const { cart, updateCartItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const quantityRef = useRef(cart?.totalQuantity);
  const [favProducts, setFavProducts] = useState<FavProduct[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);
  const [tierName, setTierName] = useState<string | null>(null);
  const [addingFav, setAddingFav] = useState<string | null>(null);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  useEffect(() => {
    if (!cart) {
      createCartAndSetCookie();
    }
  }, [cart]);

  useEffect(() => {
    if (
      cart?.totalQuantity &&
      cart?.totalQuantity !== quantityRef.current &&
      cart?.totalQuantity > 0
    ) {
      setIsOpen(true);
      quantityRef.current = cart?.totalQuantity;
    }
  }, [cart?.totalQuantity]);

  // Listen for custom open-cart events (from quick-add etc.)
  useEffect(() => {
    const handleOpenCart = () => setIsOpen(true);
    window.addEventListener("open-cart", handleOpenCart);
    return () => window.removeEventListener("open-cart", handleOpenCart);
  }, []);

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
      const cached = sessionStorage.getItem("atheles-session");
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

  const favCacheRef = useRef<{ handles: string; products: FavProduct[] } | null>(null);

  // Load favorited products (excluding items already in cart), cached
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = localStorage.getItem("atheles-favorites");
      const favHandles: string[] = stored ? JSON.parse(stored) : [];
      if (favHandles.length === 0) {
        setFavProducts([]);
        return;
      }
      const cartHandles = cart?.lines.map((l) => l.merchandise.product.handle) || [];
      const missing = favHandles.filter((h) => !cartHandles.includes(h)).slice(0, 6);
      if (missing.length === 0) {
        setFavProducts([]);
        return;
      }
      const key = missing.sort().join(",");
      // Use cache if same set
      if (favCacheRef.current?.handles === key) {
        setFavProducts(favCacheRef.current.products);
        return;
      }
      fetch("/api/products/by-handles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handles: missing }),
      })
        .then((r) => (r.ok ? r.json() : { products: [] }))
        .then((d) => {
          const products = d.products || [];
          favCacheRef.current = { handles: key, products };
          setFavProducts(products);
        })
        .catch(() => {});
    } catch {
      setFavProducts([]);
    }
  }, [isOpen, cart?.lines]);

  const hasItems = cart && cart.lines.length > 0;

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
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-[.5px]"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-[.5px]"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed bottom-0 right-0 top-0 flex h-full w-full flex-col border-l border-brand-dark-gold/30 bg-brand-dark p-4 text-white sm:p-6 md:w-[390px]">
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
                      <a
                        href="/search/mens"
                        onClick={closeCart}
                        className="flex min-h-[44px] items-center justify-center rounded-full bg-brand-gold px-6 py-3 text-center text-sm font-medium uppercase tracking-wider text-brand-dark transition-opacity hover:opacity-90"
                      >
                        shop mens
                      </a>
                      <a
                        href="/search"
                        onClick={closeCart}
                        className="flex min-h-[44px] items-center justify-center rounded-full border border-brand-dark-gold/30 px-6 py-3 text-center text-sm uppercase tracking-wider text-brand-grey transition-colors hover:border-brand-gold hover:text-brand-gold"
                      >
                        browse all
                      </a>
                    </div>
                  </div>

                  {/* Favorites section in empty cart too */}
                  {favProducts.length > 0 && (
                    <div className="border-t border-brand-dark-gold/20 px-1 pb-4 pt-3">
                      <div className="mb-2 flex items-center gap-1.5">
                        <HeartIcon className="h-3.5 w-3.5 text-brand-gold" />
                        <p className="text-xs uppercase tracking-wider text-brand-grey">
                          from your favorites
                        </p>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {favProducts.map((p) => {
                          const canAdd = !!p.firstVariantId && !!p.availableForSale;
                          return (
                            <div
                              key={p.handle}
                              className="group flex w-[130px] flex-none flex-col rounded-lg border border-brand-dark-gold/15 bg-brand-dark-gold/5 p-2 transition-colors hover:border-brand-gold/30"
                            >
                              {canAdd ? (
                                <button
                                  type="button"
                                  disabled={addingFav === p.handle}
                                  onClick={async () => {
                                    if (!p.firstVariantId) return;
                                    setAddingFav(p.handle);
                                    try {
                                      await addItem(null, p.firstVariantId);
                                    } catch {}
                                    setAddingFav(null);
                                  }}
                                  className="text-left"
                                >
                                  <div className="relative mb-1.5 aspect-square w-full overflow-hidden rounded">
                                    {p.featuredImage?.url ? (
                                      <Image src={p.featuredImage.url} alt={p.title} fill className="object-cover" sizes="130px" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center bg-brand-medium-grey/20">
                                        <span className="text-[8px] text-brand-grey">ATHELES</span>
                                      </div>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/0 transition-colors group-hover:bg-brand-dark/40">
                                      <span className="text-xs font-medium uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
                                        {addingFav === p.handle ? "adding..." : "+ add"}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="truncate text-[10px] text-white group-hover:text-brand-gold">{p.title}</p>
                                </button>
                              ) : (
                                <div>
                                  <div className="relative mb-1.5 aspect-square w-full overflow-hidden rounded">
                                    {p.featuredImage?.url ? (
                                      <Image src={p.featuredImage.url} alt={p.title} fill className="object-cover opacity-50" sizes="130px" />
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
                                <a href={`/product/${p.handle}`} onClick={closeCart} className="text-[10px] text-brand-gold transition-colors hover:text-brand-pale-gold">
                                  view
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden">
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
                  <ul className="mt-3 grow overflow-auto">
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
                            key={item.id ?? item.merchandise.id}
                            className="flex w-full flex-col border-b border-brand-dark-gold/20"
                          >
                            <div className="relative flex w-full flex-row justify-between gap-3 py-4 pl-11 pr-1">
                              <div className="absolute left-0 top-3 z-40">
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
                  {favProducts.length > 0 && (
                    <div className="border-t border-brand-dark-gold/20 pt-3">
                      <div className="mb-2 flex items-center gap-1.5">
                        <HeartIcon className="h-3.5 w-3.5 text-brand-gold" />
                        <p className="text-xs uppercase tracking-wider text-brand-grey">
                          from your favorites
                        </p>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {favProducts.map((p) => {
                          const canAdd = !!p.firstVariantId && !!p.availableForSale;
                          return (
                          <div
                            key={p.handle}
                            className="group flex w-[130px] flex-none flex-col rounded-lg border border-brand-dark-gold/15 bg-brand-dark-gold/5 p-2 transition-colors hover:border-brand-gold/30"
                          >
                            {/* Image: adds to cart if available, otherwise links to page */}
                            {canAdd ? (
                              <button
                                type="button"
                                disabled={addingFav === p.handle}
                                onClick={async () => {
                                  if (!p.firstVariantId) return;
                                  setAddingFav(p.handle);
                                  try {
                                    await addItem(null, p.firstVariantId);
                                  } catch {}
                                  setAddingFav(null);
                                }}
                                className="text-left"
                              >
                                <div className="relative mb-1.5 aspect-square w-full overflow-hidden rounded">
                                  {p.featuredImage?.url ? (
                                    <Image
                                      src={p.featuredImage.url}
                                      alt={p.title}
                                      fill
                                      className="object-cover"
                                      sizes="130px"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-brand-medium-grey/20">
                                      <span className="text-[8px] text-brand-grey">ATHELES</span>
                                    </div>
                                  )}
                                  {/* Add overlay */}
                                  <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/0 transition-colors group-hover:bg-brand-dark/40">
                                    <span className="text-xs font-medium uppercase tracking-wider text-white opacity-0 transition-opacity group-hover:opacity-100">
                                      {addingFav === p.handle ? "adding..." : "+ add"}
                                    </span>
                                  </div>
                                </div>
                                <p className="truncate text-[10px] text-white group-hover:text-brand-gold">
                                  {p.title}
                                </p>
                              </button>
                            ) : (
                              <div>
                                <div className="relative mb-1.5 aspect-square w-full overflow-hidden rounded">
                                  {p.featuredImage?.url ? (
                                    <Image
                                      src={p.featuredImage.url}
                                      alt={p.title}
                                      fill
                                      className="object-cover opacity-50"
                                      sizes="130px"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-brand-medium-grey/20">
                                      <span className="text-[8px] text-brand-grey">ATHELES</span>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] uppercase tracking-wider text-red-400">sold out</span>
                                  </div>
                                </div>
                                <p className="truncate text-[10px] text-white/50">
                                  {p.title}
                                </p>
                              </div>
                            )}
                            <div className="mt-1 flex items-center justify-between">
                              <Price
                                className="text-[10px] text-brand-grey"
                                amount={p.priceRange.maxVariantPrice.amount}
                                currencyCode={p.priceRange.maxVariantPrice.currencyCode}
                              />
                              <a
                                href={`/product/${p.handle}`}
                                onClick={closeCart}
                                className="text-[10px] text-brand-gold transition-colors hover:text-brand-pale-gold"
                              >
                                view
                              </a>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Discount code */}
                  {(() => {
                    const appliedCode = cart.discountCodes?.find((dc) => dc.applicable);
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
                        {appliedCode ? (
                          <div className="flex items-center justify-between rounded-lg border border-brand-gold/30 bg-brand-gold/5 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-brand-gold">{appliedCode.code}</span>
                              {totalDiscount > 0 && (
                                <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400">
                                  -{new Intl.NumberFormat(undefined, { style: "currency", currency: cart.cost.totalAmount.currencyCode, currencyDisplay: "narrowSymbol" }).format(totalDiscount)} off
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                await removeDiscountCode();
                                setDiscountCode("");
                                setDiscountError("");
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
                                    (e.target as HTMLInputElement).closest("div")?.querySelector("button")?.click();
                                  }
                                }}
                                enterKeyHint="go"
                                className="flex-1 rounded-lg border border-brand-dark-gold/20 bg-transparent px-3 py-2 text-sm text-white placeholder:text-brand-grey/50 focus:border-brand-gold focus:outline-none"
                              />
                              <button
                                type="button"
                                disabled={!discountCode.trim() || applyingDiscount}
                                onClick={async () => {
                                  setApplyingDiscount(true);
                                  setDiscountError("");
                                  const result = await applyDiscountCode(discountCode.trim());
                                  if (!result.success) {
                                    setDiscountError(result.error || "failed to apply code.");
                                  } else if (!result.applicable) {
                                    setDiscountError("invalid or expired code.");
                                    await removeDiscountCode();
                                  }
                                  setApplyingDiscount(false);
                                }}
                                className="rounded-lg border border-brand-gold/40 px-4 py-2 text-xs uppercase tracking-wider text-brand-gold transition-colors hover:bg-brand-gold/10 disabled:opacity-30"
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
    <div className="relative flex h-11 w-11 items-center justify-center rounded-md border border-brand-dark-gold/30 text-brand-grey transition-colors hover:text-brand-gold">
      <XMarkIcon
        className={clsx(
          "h-6 transition-all ease-in-out hover:scale-110",
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
      className="tap-target flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-brand-gold p-3 text-center font-heading text-sm font-medium uppercase tracking-wider text-brand-dark opacity-90 transition-opacity hover:opacity-100"
      type="submit"
      disabled={pending}
    >
      {pending ? (
        <LoadingDots className="bg-brand-dark" />
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
          </svg>
          Checkout Securely
        </>
      )}
    </button>
  );
}
