import { SHOPIFY_GRAPHQL_API_ENDPOINT } from "lib/constants";

const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";

const endpoint = domain ? `${domain}${SHOPIFY_GRAPHQL_API_ENDPOINT}` : "";
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "";

async function shopifyCustomerFetch<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Shopify request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  if (json.errors) {
    throw new Error(json.errors[0]?.message || "Shopify GraphQL error");
  }

  if (!json.data) {
    throw new Error("No data returned from Shopify");
  }

  return json.data;
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
      customerUserErrors: { code: string; message: string }[];
    };
  }>(
    `mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id }
        customerUserErrors { code message }
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
    return {
      success: false,
      error: errors[0]?.message || "failed to create account",
    };
  }
  return { success: true };
}

export async function authenticateCustomer(
  email: string,
  password: string
): Promise<{ accessToken: string; expiresAt: string } | null> {
  if (!endpoint) return null;

  const data = await shopifyCustomerFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: {
        accessToken: string;
        expiresAt: string;
      } | null;
      customerUserErrors: { code: string; message: string }[];
    };
  }>(
    `mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code message }
      }
    }`,
    { input: { email, password } }
  );

  return data.customerAccessTokenCreate.customerAccessToken;
}

export async function activateCustomerByUrl(
  activationUrl: string,
  password: string
): Promise<{ accessToken: string; expiresAt: string } | { error: string }> {
  if (!endpoint) return { error: "store not configured" };

  const data = await shopifyCustomerFetch<{
    customerActivateByUrl: {
      customerAccessToken: {
        accessToken: string;
        expiresAt: string;
      } | null;
      customerUserErrors: { code: string; message: string }[];
    };
  }>(
    `mutation customerActivateByUrl($activationUrl: URL!, $password: String!) {
      customerActivateByUrl(activationUrl: $activationUrl, password: $password) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code message }
      }
    }`,
    { activationUrl, password }
  );

  const errors = data.customerActivateByUrl.customerUserErrors;
  if (errors.length > 0) {
    return { error: errors[0]?.message || "failed to activate account" };
  }

  const tokenData = data.customerActivateByUrl.customerAccessToken;
  if (!tokenData) {
    return { error: "failed to activate account" };
  }

  return { accessToken: tokenData.accessToken, expiresAt: tokenData.expiresAt };
}

export async function updateCustomer(
  accessToken: string,
  input: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    acceptsMarketing?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!endpoint) return { success: false, error: "store not configured" };

  const data = await shopifyCustomerFetch<{
    customerUpdate: {
      customer: { id: string } | null;
      customerUserErrors: { code: string; message: string }[];
    };
  }>(
    `mutation customerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
      customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
        customer { id }
        customerUserErrors { code message }
      }
    }`,
    { customerAccessToken: accessToken, customer: input }
  );

  const errors = data.customerUpdate.customerUserErrors;
  if (errors.length > 0) {
    return { success: false, error: errors[0]?.message || "failed to update profile" };
  }
  return { success: true };
}

export async function getCustomerByToken(accessToken: string): Promise<{
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  phone: string | null;
  acceptsMarketing: boolean;
  createdAt: string;
  numberOfOrders: string;
  totalSpent: string;
} | null> {
  if (!endpoint) return null;

  const data = await shopifyCustomerFetch<{
    customer: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      displayName: string;
      phone: string | null;
      acceptsMarketing: boolean;
      createdAt: string;
      orders: { totalCount: string };
      totalSpent: { amount: string };
    } | null;
  }>(
    `query customer($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id email firstName lastName displayName phone acceptsMarketing createdAt
        orders(first: 1) { totalCount }
        totalSpent { amount }
      }
    }`,
    { customerAccessToken: accessToken }
  );

  if (!data.customer) return null;

  return {
    id: data.customer.id,
    email: data.customer.email,
    firstName: data.customer.firstName,
    lastName: data.customer.lastName,
    displayName: data.customer.displayName,
    phone: data.customer.phone,
    acceptsMarketing: data.customer.acceptsMarketing,
    createdAt: data.customer.createdAt,
    numberOfOrders: data.customer.orders.totalCount,
    totalSpent: data.customer.totalSpent.amount,
  };
}
