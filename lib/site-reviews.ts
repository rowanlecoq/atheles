const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const adminEndpoint = domain ? `${domain}/admin/api/2025-04/graphql.json` : "";

export type SiteReviewReaction = { email: string; type: "up" | "down" };
export type SiteReviewReply = {
  id: string;
  authorName: string;
  authorEmail: string;
  avatarUrl?: string;
  body: string;
  createdAt: string;
};

export type SiteReview = {
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
  productTitle?: string;
  avatarUrl?: string;
  reactions?: SiteReviewReaction[];
  replies?: SiteReviewReply[];
};

export type PublicReply = {
  id: string;
  authorName: string;
  avatarUrl?: string;
  body: string;
  createdAt: string;
  isOwn: boolean;
};

export type PublicSiteReview = {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  flagged: boolean;
  hidden: boolean;
  flagCount: number;
  productTitle?: string;
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

async function getShopIdAndReviews(): Promise<{ shopId: string; reviews: SiteReview[] }> {
  const data = await adminFetch<{
    shop: { id: string; metafield: { value: string } | null };
  }>(
    `query {
      shop {
        id
        metafield(namespace: "atheles", key: "site_reviews") { value }
      }
    }`,
    {},
  );

  const raw = data.shop.metafield?.value;
  let reviews: SiteReview[] = [];
  if (raw) {
    try {
      reviews = JSON.parse(raw) as SiteReview[];
    } catch {
      reviews = [];
    }
  }

  return { shopId: data.shop.id, reviews };
}

async function saveReviews(shopId: string, reviews: SiteReview[]): Promise<void> {
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
          ownerId: shopId,
          namespace: "atheles",
          key: "site_reviews",
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

export async function getSiteReviews(
  includeAll = false,
  currentUserEmail?: string,
): Promise<{ reviews: PublicSiteReview[]; myReviewId: string | null }> {
  const { reviews } = await getShopIdAndReviews();
  const filtered = includeAll ? reviews : reviews.filter((r) => !r.hidden);

  const publicReviews: PublicSiteReview[] = filtered.map((r) => {
    const { authorEmail: _email, reactions, replies: rawReplies, ...rest } = r;
    const upCount = reactions?.filter((rx) => rx.type === "up").length ?? 0;
    const downCount = reactions?.filter((rx) => rx.type === "down").length ?? 0;
    const myReaction = currentUserEmail
      ? (reactions?.find((rx) => rx.email.toLowerCase() === currentUserEmail.toLowerCase())?.type ?? null)
      : null;
    const replies: PublicReply[] = (rawReplies ?? []).map((rp) => ({
      id: rp.id,
      authorName: rp.authorName,
      avatarUrl: rp.avatarUrl,
      body: rp.body,
      createdAt: rp.createdAt,
      isOwn: currentUserEmail ? rp.authorEmail.toLowerCase() === currentUserEmail.toLowerCase() : false,
    }));
    const isOwn = currentUserEmail ? r.authorEmail.toLowerCase() === currentUserEmail.toLowerCase() : false;
    return { ...rest, upCount, downCount, myReaction, replies, isOwn };
  });

  // myReviewId is only for brand-level reviews (not product cross-posts)
  const myReviewId = currentUserEmail
    ? (reviews.find((r) => r.authorEmail.toLowerCase() === currentUserEmail.toLowerCase() && !r.productTitle)?.id ?? null)
    : null;

  return { reviews: publicReviews, myReviewId };
}

// Backfill avatarUrl for existing reviews by this author that were saved without one
export async function backfillReviewAvatar(authorEmail: string, avatarUrl: string): Promise<void> {
  const { shopId, reviews } = await getShopIdAndReviews();
  const toUpdate = reviews.filter(
    (r) => r.authorEmail.toLowerCase() === authorEmail.toLowerCase() && !r.avatarUrl,
  );
  if (toUpdate.length === 0) return;
  for (const r of toUpdate) r.avatarUrl = avatarUrl;
  await saveReviews(shopId, reviews);
}

export async function addSiteReview({
  authorName,
  authorEmail,
  rating,
  title,
  body,
  productTitle,
  avatarUrl,
}: {
  authorName: string;
  authorEmail: string;
  rating: number;
  title: string;
  body: string;
  productTitle?: string;
  avatarUrl?: string;
}): Promise<PublicSiteReview> {
  const { shopId, reviews } = await getShopIdAndReviews();

  if (productTitle) {
    const duplicate = reviews.some(
      (r) => r.authorEmail.toLowerCase() === authorEmail.toLowerCase() && r.productTitle === productTitle,
    );
    if (duplicate) throw new Error("already reviewed this product in community.");
  }

  const newReview: SiteReview = {
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
    ...(productTitle && { productTitle }),
    ...(avatarUrl && { avatarUrl }),
  };

  reviews.push(newReview);
  await saveReviews(shopId, reviews);

  return {
    id: newReview.id,
    authorName: newReview.authorName,
    rating: newReview.rating,
    title: newReview.title,
    body: newReview.body,
    createdAt: newReview.createdAt,
    flagged: newReview.flagged,
    hidden: newReview.hidden,
    flagCount: newReview.flagCount,
    ...(newReview.productTitle && { productTitle: newReview.productTitle }),
    ...(newReview.avatarUrl && { avatarUrl: newReview.avatarUrl }),
    upCount: 0,
    downCount: 0,
    myReaction: null,
    replies: [],
    isOwn: true,
  };
}

export async function flagSiteReview(reviewId: string): Promise<void> {
  const { shopId, reviews } = await getShopIdAndReviews();
  const review = reviews.find((r) => r.id === reviewId);
  if (!review) throw new Error("Review not found.");
  review.flagCount = (review.flagCount || 0) + 1;
  if (review.flagCount >= 3) review.flagged = true;
  await saveReviews(shopId, reviews);
}

export async function moderateSiteReview(reviewId: string, hidden: boolean): Promise<void> {
  const { shopId, reviews } = await getShopIdAndReviews();
  const review = reviews.find((r) => r.id === reviewId);
  if (!review) throw new Error("Review not found.");
  review.hidden = hidden;
  await saveReviews(shopId, reviews);
}

export async function deleteSiteReview(reviewId: string, authorEmail: string): Promise<void> {
  const { shopId, reviews } = await getShopIdAndReviews();
  const idx = reviews.findIndex((r) => r.id === reviewId);
  if (idx === -1) throw new Error("Review not found.");
  if (reviews[idx]!.authorEmail.toLowerCase() !== authorEmail.toLowerCase()) {
    throw new Error("Not authorized.");
  }
  reviews.splice(idx, 1);
  await saveReviews(shopId, reviews);
}

export async function editSiteReview(
  reviewId: string,
  authorEmail: string,
  update: { rating: number; title: string; body: string; avatarUrl?: string },
): Promise<PublicSiteReview> {
  const { shopId, reviews } = await getShopIdAndReviews();
  const review = reviews.find((r) => r.id === reviewId);
  if (!review) throw new Error("Review not found.");
  if (review.authorEmail.toLowerCase() !== authorEmail.toLowerCase()) {
    throw new Error("Not authorized.");
  }
  review.rating = update.rating;
  review.title = update.title;
  review.body = update.body;
  if (update.avatarUrl !== undefined) review.avatarUrl = update.avatarUrl || undefined;
  await saveReviews(shopId, reviews);

  const upCount = review.reactions?.filter((rx) => rx.type === "up").length ?? 0;
  const downCount = review.reactions?.filter((rx) => rx.type === "down").length ?? 0;
  const myReaction = review.reactions?.find((rx) => rx.email.toLowerCase() === authorEmail.toLowerCase())?.type ?? null;
  const replies: PublicReply[] = (review.replies ?? []).map((rp) => ({
    id: rp.id,
    authorName: rp.authorName,
    avatarUrl: rp.avatarUrl,
    body: rp.body,
    createdAt: rp.createdAt,
    isOwn: rp.authorEmail.toLowerCase() === authorEmail.toLowerCase(),
  }));

  return {
    id: review.id,
    authorName: review.authorName,
    rating: review.rating,
    title: review.title,
    body: review.body,
    createdAt: review.createdAt,
    flagged: review.flagged,
    hidden: review.hidden,
    flagCount: review.flagCount,
    ...(review.productTitle && { productTitle: review.productTitle }),
    ...(review.avatarUrl && { avatarUrl: review.avatarUrl }),
    upCount,
    downCount,
    myReaction,
    replies,
    isOwn: true,
  };
}

export async function toggleReaction(
  reviewId: string,
  email: string,
  type: "up" | "down",
): Promise<{ upCount: number; downCount: number; myReaction: "up" | "down" | null }> {
  const { shopId, reviews } = await getShopIdAndReviews();
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
  await saveReviews(shopId, reviews);
  const upCount = review.reactions.filter((rx) => rx.type === "up").length;
  const downCount = review.reactions.filter((rx) => rx.type === "down").length;
  const myReaction = review.reactions.find((rx) => rx.email.toLowerCase() === email.toLowerCase())?.type ?? null;
  return { upCount, downCount, myReaction };
}

export async function addReply(
  reviewId: string,
  authorName: string,
  authorEmail: string,
  body: string,
  avatarUrl?: string,
): Promise<PublicReply> {
  const { shopId, reviews } = await getShopIdAndReviews();
  const review = reviews.find((r) => r.id === reviewId);
  if (!review) throw new Error("Review not found.");
  if (!review.replies) review.replies = [];
  const reply: SiteReviewReply = {
    id: crypto.randomUUID(),
    authorName,
    authorEmail,
    body,
    createdAt: new Date().toISOString(),
    ...(avatarUrl && { avatarUrl }),
  };
  review.replies.push(reply);
  await saveReviews(shopId, reviews);
  return { id: reply.id, authorName: reply.authorName, avatarUrl: reply.avatarUrl, body: reply.body, createdAt: reply.createdAt, isOwn: true };
}

export async function deleteReply(
  reviewId: string,
  replyId: string,
  authorEmail: string,
  isAdmin = false,
): Promise<void> {
  const { shopId, reviews } = await getShopIdAndReviews();
  const review = reviews.find((r) => r.id === reviewId);
  if (!review) throw new Error("Review not found.");
  const idx = review.replies?.findIndex((rp) => rp.id === replyId) ?? -1;
  if (idx === -1) throw new Error("Reply not found.");
  if (!isAdmin && review.replies![idx]!.authorEmail.toLowerCase() !== authorEmail.toLowerCase()) {
    throw new Error("Not authorized.");
  }
  review.replies!.splice(idx, 1);
  await saveReviews(shopId, reviews);
}
