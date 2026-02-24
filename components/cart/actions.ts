"use server";

import { TAGS } from "lib/constants";
import {
  addToCart,
  createCart,
  getCart,
  removeFromCart,
  updateCart,
} from "lib/shopify";
import { isShopifyConfigured } from "lib/shopify/is-configured";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function addItem(
  prevState: unknown,
  selectedVariantId: string | undefined,
) {
  if (!selectedVariantId) {
    return "Error adding item to cart";
  }

  if (!isShopifyConfigured) {
    return "Store is not yet configured";
  }

  try {
    await addToCart([{ merchandiseId: selectedVariantId, quantity: 1 }]);
    updateTag(TAGS.cart);
  } catch (e) {
    console.error("addItem error:", e);
    return "Error adding item to cart";
  }
}

export async function removeItem(prevState: unknown, merchandiseId: string) {
  if (!isShopifyConfigured) return "Store is not yet configured";

  try {
    const cart = await getCart();

    if (!cart) {
      return "Error fetching cart";
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId,
    );

    if (lineItem && lineItem.id) {
      await removeFromCart([lineItem.id]);
      updateTag(TAGS.cart);
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
    merchandiseId: string;
    quantity: number;
  },
) {
  if (!isShopifyConfigured) return "Store is not yet configured";

  const { merchandiseId, quantity } = payload;

  try {
    const cart = await getCart();

    if (!cart) {
      return "Error fetching cart";
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId,
    );

    if (lineItem && lineItem.id) {
      if (quantity === 0) {
        await removeFromCart([lineItem.id]);
      } else {
        await updateCart([
          {
            id: lineItem.id,
            merchandiseId,
            quantity,
          },
        ]);
      }
    } else if (quantity > 0) {
      await addToCart([{ merchandiseId, quantity }]);
    }

    updateTag(TAGS.cart);
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
