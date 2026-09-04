const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const adminEndpoint = domain ? `${domain}/admin/api/2025-04/graphql.json` : "";

export type ReviewReaction = { email: string; type: "up" | "down" };
export type ReviewReply = {
  id: string;
  authorName: string;
  authorEmail: string;
  avatarUrl?: string;
  body: string;
  createdAt: string;
};

export type Review = {
  id: string;
  authorName: string;
  authorEmail: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  flagged: boolean;
  hidden: boolean;
  flagCount: number;
  avatarUrl?: string;
  reactions?: ReviewReaction[];
  replies?: ReviewReply[];
};

export type PublicReply = {
  id: string;
  authorName: string;
  avatarUrl?: string;
  body: string;
  createdAt: string;
  isOwn: boolean;
};

export type PublicReview = {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  flagged: boolean;
  hidden: boolean;
  flagCount: number;
  avatarUrl?: string;
  upCount: number;
  downCount: number;
  myReaction: "up" | "down" | null;
  replies: PublicReply[];
  isOwn: boolean;
};

async function adminFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(adminEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || "Admin GraphQL error");
  return json.data as T;
}

async function getProductIdAndReviews(
  handle: string,
): Promise<{ productId: string; reviews: Review[] }> {
  const data = await adminFetch<{
    products: { nodes: { id: string; metafield: { value: string } | null }[] };
  }>(
    `query($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          id
          metafield(namespace: "atheles", key: "reviews") { value }
        }
      }
    }`,
    { query: `handle:${handle}` },
  );

  const product = data.products.nodes[0];
  if (!product) throw new Error(`Product not found: ${handle}`);

  const raw = product.metafield?.value;
  let reviews: Review[] = [];
  if (raw) {
    try {
      reviews = JSON.parse(raw) as Review[];
    } catch {
      reviews = [];
    }
  }

  return { productId: product.id, reviews };
}

async function saveReviews(productId: string, reviews: Review[]): Promise<void> {
  const data = await adminFetch<{
    metafieldsSet: { userErrors: { field: string[]; message: string }[] };
  }>(
    `mutation($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors { field message }
      }
    }`,
    {
      metafields: [
        {
          ownerId: productId,
          namespace: "atheles",
          key: "reviews",
          value: JSON.stringify(reviews),
          type: "json",
        },
      ],
    },
  );

  const errors = data.metafieldsSet?.userErrors;
  if (errors && errors.length > 0) {
    throw new Error(errors[0]?.message || "Failed to save reviews");
  }
}

function toPublicReview(r: Review, currentUserEmail?: string): PublicReview {
  const upCount = r.reactions?.filter((rx) => rx.type === "up").length ?? 0;
  const downCount = r.reactions?.filter((rx) => rx.type === "down").length ?? 0;
  const myReaction = currentUserEmail
    ? (r.reactions?.find((rx) => rx.email.toLowerCase() === currentUserEmail.toLowerCase())?.type ?? null)
    : null;
  const replies: PublicReply[] = (r.replies ?? []).map((rp) => ({
    id: rp.id,
    authorName: rp.authorName,
    avatarUrl: rp.avatarUrl,
    body: rp.body,
    createdAt: rp.createdAt,
    isOwn: currentUserEmail ? rp.authorEmail.toLowerCase() === currentUserEmail.toLowerCase() : false,
  }));
  const isOwn = currentUserEmail ? r.authorEmail.toLowerCase() === currentUserEmail.toLowerCase() : false;
  return {
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt,
    flagged: r.flagged,
    hidden: r.hidden,
    flagCount: r.flagCount,
    ...(r.avatarUrl && { avatarUrl: r.avatarUrl }),
    upCount,
    downCount,
    myReaction,
    replies,
    isOwn,
  };
}

export async function getProductReviews(
  handle: string,
  includeAll = false,
  currentUserEmail?: string,
): Promise<PublicReview[]> {
  const { reviews } = await getProductIdAndReviews(handle);
  const filtered = includeAll ? reviews : reviews.filter((r) => !r.hidden);
  return filtered.map((r) => toPublicReview(r, currentUserEmail));
}

export async function addProductReview(
  handle: string,
  {
    authorName,
    authorEmail,
    rating,
    title,
    body,
    avatarUrl,
  }: {
    authorName: string;
    authorEmail: string;
    rating: number;
    title: string;
    body: string;
    avatarUrl?: string;
  },
): Promise<PublicReview> {
  const { productId, reviews } = await getProductIdAndReviews(handle);

  const newReview: Review = {
    id: crypto.randomUUID(),
    authorName,
    authorEmail,
    rating,
    title,
    body,
    createdAt: new Date().toISOString(),
    flagged: false,
    hidden: false,
    flagCount: 0,
    ...(avatarUrl && { avatarUrl }),
  };

  reviews.push(newReview);
  await saveReviews(productId, reviews);

  return toPublicReview(newReview, authorEmail);
}

export async function editProductReview(
  handle: string,
  reviewId: string,
  authorEmail: string,
  update: { rating: number; title: string; body: string },
): Promise<PublicReview> {
  const { productId, reviews } = await getProductIdAndReviews(handle);
  const review = reviews.find((r) => r.id === reviewId);
  if (!review) throw new Error("Review not found.");
  if (review.authorEmail.toLowerCase() !== authorEmail.toLowerCase()) throw new Error("Not authorized.");
  review.rating = update.rating;
  review.title = update.title;
  review.body = update.body;
  await saveReviews(productId, reviews);
  return toPublicReview(review, authorEmail);
}

export async function deleteProductReview(
  handle: string,
  reviewId: string,
  authorEmail: string,
  isAdmin = false,
): Promise<void> {
  const { productId, reviews } = await getProductIdAndReviews(handle);
  const idx = reviews.findIndex((r) => r.id === reviewId);
  if (idx === -1) throw new Error("Review not found.");
  if (!isAdmin && reviews[idx]!.authorEmail.toLowerCase() !== authorEmail.toLowerCase()) {
    throw new Error("Not authorized.");
  }
  reviews.splice(idx, 1);
  await saveReviews(productId, reviews);
}

export async function toggleProductReaction(
  handle: string,
  reviewId: string,
  email: string,
  type: "up" | "down",
): Promise<{ upCount: number; downCount: number; myReaction: "up" | "down" | null }> {
  const { productId, reviews } = await getProductIdAndReviews(handle);
  const review = reviews.find((r) => r.id === reviewId);
  if (!review) throw new Error("Review not found.");
  if (!review.reactions) review.reactions = [];
  const existing = review.reactions.find((rx) => rx.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    if (existing.type === type) {
      review.reactions = review.reactions.filter((rx) => rx.email.toLowerCase() !== email.toLowerCase());
    } else {
      existing.type = type;
    }
  } else {
    review.reactions.push({ email, type });
  }
  await saveReviews(productId, reviews);
  const upCount = review.reactions.filter((rx) => rx.type === "up").length;
  const downCount = review.reactions.filter((rx) => rx.type === "down").length;
  const myReaction = review.reactions.find((rx) => rx.email.toLowerCase() === email.toLowerCase())?.type ?? null;
  return { upCount, downCount, myReaction };
}

export async function addProductReply(
  handle: string,
  reviewId: string,
  authorName: string,
  authorEmail: string,
  body: string,
  avatarUrl?: string,
): Promise<PublicReply> {
  const { productId, reviews } = await getProductIdAndReviews(handle);
  const review = reviews.find((r) => r.id === reviewId);
  if (!review) throw new Error("Review not found.");
  if (!review.replies) review.replies = [];
  const reply: ReviewReply = {
    id: crypto.randomUUID(),
    authorName,
    authorEmail,
    body,
    createdAt: new Date().toISOString(),
    ...(avatarUrl && { avatarUrl }),
  };
  review.replies.push(reply);
  await saveReviews(productId, reviews);
  return { id: reply.id, authorName: reply.authorName, avatarUrl: reply.avatarUrl, body: reply.body, createdAt: reply.createdAt, isOwn: true };
}

export async function deleteProductReply(
  handle: string,
  reviewId: string,
  replyId: string,
  authorEmail: string,
  isAdmin = false,
): Promise<void> {
  const { productId, reviews } = await getProductIdAndReviews(handle);
  const review = reviews.find((r) => r.id === reviewId);
  if (!review) throw new Error("Review not found.");
  const idx = review.replies?.findIndex((rp) => rp.id === replyId) ?? -1;
  if (idx === -1) throw new Error("Reply not found.");
  if (!isAdmin && review.replies![idx]!.authorEmail.toLowerCase() !== authorEmail.toLowerCase()) {
    throw new Error("Not authorized.");
  }
  review.replies!.splice(idx, 1);
  await saveReviews(productId, reviews);
}

export async function flagReview(handle: string, reviewId: string): Promise<void> {
  const { productId, reviews } = await getProductIdAndReviews(handle);

  const review = reviews.find((r) => r.id === reviewId);
  if (!review) throw new Error("Review not found.");

  review.flagCount = (review.flagCount || 0) + 1;
  if (review.flagCount >= 3) {
    review.flagged = true;
  }

  await saveReviews(productId, reviews);
}

export async function moderateReview(
  handle: string,
  reviewId: string,
  hidden: boolean,
): Promise<void> {
  const { productId, reviews } = await getProductIdAndReviews(handle);

  const review = reviews.find((r) => r.id === reviewId);
  if (!review) throw new Error("Review not found.");

  review.hidden = hidden;

  await saveReviews(productId, reviews);
}
