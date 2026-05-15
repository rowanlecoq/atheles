"use server";

import { TAGS } from "lib/constants";
import { getCustomerByToken } from "lib/auth/shopify-customer";
import {
  addToCart,
  createCart,
  getCart,
  removeFromCart,
  updateCart,
  updateCartDiscountCodes,
} from "lib/shopify";
import type { Cart } from "lib/shopify/types";
import { isShopifyConfigured } from "lib/shopify/is-configured";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Tier-locked discount codes — requires specific tier or above to use
const TIER_LOCKED_CODES: Record<string, string> = {
  silverloyalty: "silver",
  goldloyalty: "gold",
  platinumloyalty: "platinum",
  championloyalty: "champion",
  athelesathlete: "athlete", // athlete-only code
};

// Athletes can ONLY use athlete codes, not regular tier codes
const ATHLETE_ONLY_CODES = new Set(["athelesathlete"]);
const REGULAR_TIER_CODES = new Set(["silverloyalty", "goldloyalty", "platinumloyalty", "championloyalty"]);

const TIER_LEVELS: Record<string, number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  platinum: 3,
  champion: 4,
};

function getUserTierLevel(totalSpent: string): { name: string; level: number } {
  const points = Math.floor(parseFloat(totalSpent || "0") * 50);
  if (points >= 50000) return { name: "champion", level: 4 };
  if (points >= 30000) return { name: "platinum", level: 3 };
  if (points >= 15000) return { name: "gold", level: 2 };
  if (points >= 5000) return { name: "silver", level: 1 };
  return { name: "bronze", level: 0 };
}

export async function addItem(
  prevState: unknown,
  selectedVariantId: string | undefined,
): Promise<{ cart: Awaited<ReturnType<typeof addToCart>> } | string | undefined> {
  if (!selectedVariantId) {
    return "Error adding item to cart";
  }

  if (!isShopifyConfigured) {
    return "Store is not yet configured";
  }

  try {
    const existingCart = await getCart();
    const existingLine = existingCart?.lines.find(
      (l) => l.merchandise.id === selectedVariantId,
    );
    let cart;
    if (existingLine?.id) {
      cart = await updateCart([{
        id: existingLine.id,
        merchandiseId: selectedVariantId,
        quantity: existingLine.quantity + 1,
      }]);
      // If the line is gone from the returned cart, the stored line ID was stale
      // (item was deleted between getCart() and now). Fall back to a fresh add.
      if (!cart.lines.some((l) => l.merchandise.id === selectedVariantId)) {
        cart = await addToCart([{ merchandiseId: selectedVariantId, quantity: 1 }]);
      }
    } else {
      if (!existingCart) {
        // No cart cookie yet — create one and set the cookie so addToCart can use it.
        const newCart = await createCart();
        if (newCart.id) {
          (await cookies()).set("cartId", newCart.id);
        }
      }
      cart = await addToCart([{ merchandiseId: selectedVariantId, quantity: 1 }]);
    }
    // Invalidate the server-side cart cache so the next RSC render (e.g. on
    // navigation) fetches the updated Shopify cart instead of a stale snapshot.
    updateTag(TAGS.cart);
    return { cart };
  } catch (e) {
    console.error("addItem error:", e);
    return "Error adding item to cart";
  }
}

export async function removeItem(
  prevState: unknown,
  payload: { lineItemId: string | undefined; merchandiseId: string },
): Promise<{ cart: Cart } | string> {
  if (!isShopifyConfigured) return "Store is not yet configured";

  const { lineItemId, merchandiseId } = payload;

  try {
    // Use client-provided line item ID to skip getCart() (cache may be stale)
    if (lineItemId) {
      const cart = await removeFromCart([lineItemId]);
      return { cart };
    }

    // Fallback: fetch cart to find the line item ID
    const currentCart = await getCart();
    if (!currentCart) return "Error fetching cart";

    const lineItem = currentCart.lines.find(
      (line) => line.merchandise.id === merchandiseId,
    );

    if (lineItem && lineItem.id) {
      const cart = await removeFromCart([lineItem.id]);
      return { cart };
    } else {
      return "Item not found in cart";
    }
  } catch (e) {
    console.error("removeItem error:", e);
    return "Error removing item from cart";
  }
}

export async function updateItemQuantity(
  prevState: unknown,
  payload: {
    lineItemId: string | undefined;
    merchandiseId: string;
    quantity: number;
  },
): Promise<{ cart: Cart } | string> {
  if (!isShopifyConfigured) return "Store is not yet configured";

  const { lineItemId, merchandiseId, quantity } = payload;

  try {
    // Use client-provided line item ID to skip getCart() (cache may be stale)
    if (lineItemId) {
      let cart: Cart;
      if (quantity === 0) {
        cart = await removeFromCart([lineItemId]);
      } else {
        cart = await updateCart([{ id: lineItemId, merchandiseId, quantity }]);
      }
      return { cart };
    }

    // Fallback: fetch cart to find the line item ID
    const currentCart = await getCart();
    if (!currentCart) return "Error fetching cart";

    const lineItem = currentCart.lines.find(
      (line) => line.merchandise.id === merchandiseId,
    );

    let cart: Cart;
    if (lineItem && lineItem.id) {
      if (quantity === 0) {
        cart = await removeFromCart([lineItem.id]);
      } else {
        cart = await updateCart([{ id: lineItem.id, merchandiseId, quantity }]);
      }
    } else if (quantity > 0) {
      cart = await addToCart([{ merchandiseId, quantity }]);
    } else {
      return "Item not found in cart";
    }

    return { cart };
  } catch (e) {
    console.error("updateItemQuantity error:", e);
    return "Error updating item quantity";
  }
}

export async function redirectToCheckout() {
  const cart = await getCart();

  if (!cart?.checkoutUrl) {
    redirect("/");
  }

  redirect(cart.checkoutUrl);
}

export async function applyDiscountCode(code: string): Promise<{
  success: boolean;
  applicable: boolean;
  error?: string;
  cart?: Awaited<ReturnType<typeof getCart>>;
}> {
  if (!isShopifyConfigured) return { success: false, applicable: false };

  try {
    // Check if this is a tier-locked code
    const codeLower = code.toLowerCase().trim();
    const requiredTier = TIER_LOCKED_CODES[codeLower];

    if (requiredTier) {
      // Tier-locked code — verify the user has the right rank
      const cookieStore = await cookies();
      const token = cookieStore.get("atheles-auth-token")?.value;

      if (!token) {
        return { success: false, applicable: false, error: "sign in to use loyalty codes." };
      }

      const customer = await getCustomerByToken(token);
      if (!customer) {
        return { success: false, applicable: false, error: "sign in to use loyalty codes." };
      }

      // Check admin override
      const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
      const totalSpent = adminEmails.includes(customer.email.toLowerCase())
        ? "1100.00"
        : customer.totalSpent;

      const isAthlete = customer.isAthlete;

      // Athlete-only codes: only athletes can use them
      if (ATHLETE_ONLY_CODES.has(codeLower) && !isAthlete) {
        return {
          success: false,
          applicable: false,
          error: "this code is reserved for atheles athletes.",
        };
      }

      // Regular tier codes: athletes CANNOT use them (they have their own)
      if (REGULAR_TIER_CODES.has(codeLower) && isAthlete) {
        return {
          success: false,
          applicable: false,
          error: "athletes have their own exclusive discount.",
        };
      }

      // Regular tier codes: check tier level
      if (!isAthlete) {
        const userTier = getUserTierLevel(totalSpent);
        const requiredLevel = TIER_LEVELS[requiredTier] ?? 0;

        if (userTier.level < requiredLevel) {
          return {
            success: false,
            applicable: false,
            error: `this code requires ${requiredTier} tier or above.`,
          };
        }
      }
    }

    // Apply to Shopify cart
    const cart = await updateCartDiscountCodes([code]);
    updateTag(TAGS.cart);

    // Check if the code was actually applicable
    const applied = cart.discountCodes?.find(
      (dc) => dc.code.toLowerCase() === codeLower,
    );

    return {
      success: true,
      applicable: !!applied?.applicable,
      cart,
    };
  } catch (e) {
    console.error("applyDiscountCode error:", e);
    return { success: false, applicable: false };
  }
}

export async function removeDiscountCode(): Promise<void> {
  if (!isShopifyConfigured) return;

  try {
    await updateCartDiscountCodes([]);
    updateTag(TAGS.cart);
  } catch (e) {
    console.error("removeDiscountCode error:", e);
  }
}

export async function createCartAndSetCookie() {
  if (!isShopifyConfigured) return;

  try {
    const cart = await createCart();
    if (cart.id) {
      (await cookies()).set("cartId", cart.id);
    }
  } catch (e) {
    console.error("createCartAndSetCookie error:", e);
  }
}
