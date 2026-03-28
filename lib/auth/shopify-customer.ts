// Isolated Shopify customer auth helper.
// Uses raw fetch() — does NOT import from lib/shopify/index.ts
// to avoid "use cache" conflicts with Turbopack.

const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";

const endpoint = domain ? `${domain}/api/2023-01/graphql.json` : "";
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "";

async function shopifyCustomerFetch<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  return json.data;
}

export async function authenticateCustomer(
  email: string,
  password: string
): Promise<{ accessToken: string; expiresAt: string } | null> {
  if (!endpoint) return null;

  const data = await shopifyCustomerFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: { accessToken: string; expiresAt: string } | null;
      customerUserErrors: { code: string; message: string }[];
    };
  }>(
    `mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          message
        }
      }
    }`,
    { input: { email, password } }
  );

  return data.customerAccessTokenCreate.customerAccessToken;
}

export async function getCustomerByToken(
  accessToken: string
): Promise<{
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  createdAt: string;
} | null> {
  if (!endpoint) return null;

  const data = await shopifyCustomerFetch<{
    customer: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      displayName: string;
      createdAt: string;
    } | null;
  }>(
    `query customer($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        email
        firstName
        lastName
        displayName
        createdAt
      }
    }`,
    { customerAccessToken: accessToken }
  );

  return data.customer;
}

export async function createCustomerAccount(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<{ success: boolean; error?: string }> {
  if (!endpoint) return { success: false, error: "store not configured" };

  const data = await shopifyCustomerFetch<{
    customerCreate: {
      customer: { id: string } | null;
      customerUserErrors: { code: string; field: string[]; message: string }[];
    };
  }>(
    `mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }`,
    {
      input: {
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        acceptsMarketing: false,
      },
    }
  );

  const errors = data.customerCreate.customerUserErrors;
  if (errors.length > 0) {
    return { success: false, error: errors[0]?.message || "failed to create account" };
  }

  return { success: true };
}
