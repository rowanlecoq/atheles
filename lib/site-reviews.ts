const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const adminEndpoint = domain ? `${domain}/admin/api/2025-04/graphql.json` : "";

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
};

export type PublicSiteReview = Omit<SiteReview, "authorEmail">;

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
  const publicReviews = filtered.map(({ authorEmail: _email, ...rest }) => rest);
  const myReviewId = currentUserEmail
    ? (reviews.find((r) => r.authorEmail.toLowerCase() === currentUserEmail.toLowerCase())?.id ?? null)
    : null;
  return { reviews: publicReviews, myReviewId };
}

export async function addSiteReview({
  authorName,
  authorEmail,
  rating,
  title,
  body,
}: {
  authorName: string;
  authorEmail: string;
  rating: number;
  title: string;
  body: string;
}): Promise<PublicSiteReview> {
  const { shopId, reviews } = await getShopIdAndReviews();

  const alreadyReviewed = reviews.some(
    (r) => r.authorEmail.toLowerCase() === authorEmail.toLowerCase(),
  );
  if (alreadyReviewed) {
    throw new Error("You have already left a review.");
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
  };

  reviews.push(newReview);
  await saveReviews(shopId, reviews);

  const { authorEmail: _email, ...publicReview } = newReview;
  return publicReview;
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
  update: { rating: number; title: string; body: string },
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
  await saveReviews(shopId, reviews);
  const { authorEmail: _email, ...publicReview } = review;
  return publicReview;
}
