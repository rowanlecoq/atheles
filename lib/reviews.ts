const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";
const adminEndpoint = domain ? `${domain}/admin/api/2025-04/graphql.json` : "";

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
};

export type PublicReview = Omit<Review, "authorEmail">;

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

export async function getProductReviews(
  handle: string,
  includeAll = false,
): Promise<PublicReview[]> {
  const { reviews } = await getProductIdAndReviews(handle);

  const filtered = includeAll ? reviews : reviews.filter((r) => !r.hidden);

  return filtered.map(({ authorEmail: _email, ...rest }) => rest);
}

export async function addProductReview(
  handle: string,
  {
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
  },
): Promise<PublicReview> {
  const { productId, reviews } = await getProductIdAndReviews(handle);

  const alreadyReviewed = reviews.some(
    (r) => r.authorEmail.toLowerCase() === authorEmail.toLowerCase(),
  );
  if (alreadyReviewed) {
    throw new Error("You have already reviewed this product.");
  }

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
  };

  reviews.push(newReview);
  await saveReviews(productId, reviews);

  const { authorEmail: _email, ...publicReview } = newReview;
  return publicReview;
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
