import { SHOPIFY_GRAPHQL_API_ENDPOINT } from "lib/constants";

const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? process.env.SHOPIFY_STORE_DOMAIN.startsWith("https://")
    ? process.env.SHOPIFY_STORE_DOMAIN
    : `https://${process.env.SHOPIFY_STORE_DOMAIN}`
  : "";

const endpoint = domain ? `${domain}${SHOPIFY_GRAPHQL_API_ENDPOINT}` : "";
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "";
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";
const adminEndpoint = domain ? `${domain}/admin/api/2024-10/graphql.json` : "";

async function shopifyCustomerFetch<T>(
  query: string,
  variables: Record<string, unknown>,
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

async function shopifyAdminFetch<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(adminEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Shopify Admin request failed: ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || "Shopify Admin GraphQL error");
  }
  return json.data;
}

export async function updateCustomerTier(
  customerEmail: string,
  tier: string,
): Promise<{ success: boolean; error?: string }> {
  if (!adminEndpoint || !adminToken) {
    return { success: false, error: "admin API not configured" };
  }

  const searchResult = await shopifyAdminFetch<{
    customers: { edges: { node: { id: string; tags: string[] } }[] };
  }>(
    `query customers($query: String!) {
      customers(first: 1, query: $query) {
        edges { node { id tags } }
      }
    }`,
    { query: `email:${customerEmail}` },
  );

  const adminCustomer = searchResult.customers.edges[0]?.node;
  if (!adminCustomer) {
    return { success: false, error: "customer not found" };
  }

  // Check if tier tag already correct — skip update if so
  const currentTierTag = adminCustomer.tags.find((t) => t.startsWith("tier:"));
  if (currentTierTag === `tier:${tier}`) {
    return { success: true };
  }

  // Never overwrite admin or athlete tags — these are hand-assigned
  if (currentTierTag === "tier:admin" || currentTierTag === "tier:athlete") {
    return { success: true };
  }

  // Remove old tier tags and add new one
  const filteredTags = adminCustomer.tags.filter((t) => !t.startsWith("tier:"));
  const newTags = [...filteredTags, `tier:${tier}`];

  await shopifyAdminFetch<{
    customerUpdate: {
      customer: { id: string } | null;
      userErrors: { message: string }[];
    };
  }>(
    `mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer { id }
        userErrors { message }
      }
    }`,
    { input: { id: adminCustomer.id, tags: newTags } },
  );

  return { success: true };
}

export async function updateCustomerTag(
  customerEmail: string,
  prefix: string,
  value: string,
): Promise<{ success: boolean; error?: string }> {
  if (!adminEndpoint || !adminToken) {
    return { success: false, error: "admin API not configured" };
  }

  const searchResult = await shopifyAdminFetch<{
    customers: { edges: { node: { id: string; tags: string[] } }[] };
  }>(
    `query customers($query: String!) {
      customers(first: 1, query: $query) {
        edges { node { id tags } }
      }
    }`,
    { query: `email:${customerEmail}` },
  );

  const adminCustomer = searchResult.customers.edges[0]?.node;
  if (!adminCustomer) {
    return { success: false, error: "customer not found in admin" };
  }

  const existingTags = adminCustomer.tags || [];
  const filteredTags = existingTags.filter((t) => !t.startsWith(`${prefix}:`));
  const newTags = [...filteredTags, `${prefix}:${value}`];

  await shopifyAdminFetch<{
    customerUpdate: {
      customer: { id: string } | null;
      userErrors: { message: string }[];
    };
  }>(
    `mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer { id }
        userErrors { message }
      }
    }`,
    { input: { id: adminCustomer.id, tags: newTags } },
  );

  return { success: true };
}

export async function updateCustomerMetafield(
  customerEmail: string,
  namespace: string,
  key: string,
  value: string,
  type: string = "single_line_text_field",
): Promise<{ success: boolean; error?: string }> {
  if (!adminEndpoint || !adminToken) {
    return { success: false, error: "admin API not configured" };
  }

  const searchResult = await shopifyAdminFetch<{
    customers: { edges: { node: { id: string } }[] };
  }>(
    `query customers($query: String!) {
      customers(first: 1, query: $query) {
        edges { node { id } }
      }
    }`,
    { query: `email:${customerEmail}` },
  );

  const adminCustomer = searchResult.customers.edges[0]?.node;
  if (!adminCustomer) {
    return { success: false, error: "customer not found" };
  }

  await shopifyAdminFetch<{
    customerUpdate: {
      customer: { id: string } | null;
      userErrors: { message: string }[];
    };
  }>(
    `mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer { id }
        userErrors { message }
      }
    }`,
    {
      input: {
        id: adminCustomer.id,
        metafields: [{ namespace, key, value, type }],
      },
    },
  );

  return { success: true };
}

export async function getCustomerMetafield(
  customerEmail: string,
  namespace: string,
  key: string,
): Promise<string | null> {
  if (!adminEndpoint || !adminToken) return null;

  try {
    const searchResult = await shopifyAdminFetch<{
      customers: {
        edges: {
          node: {
            metafield: { value: string } | null;
          };
        }[];
      };
    }>(
      `query customers($query: String!, $namespace: String!, $key: String!) {
        customers(first: 1, query: $query) {
          edges {
            node {
              metafield(namespace: $namespace, key: $key) {
                value
              }
            }
          }
        }
      }`,
      { query: `email:${customerEmail}`, namespace, key },
    );

    return searchResult.customers.edges[0]?.node?.metafield?.value || null;
  } catch {
    return null;
  }
}

export async function updateCustomerDob(
  customerEmail: string,
  dob: string,
): Promise<{ success: boolean; error?: string }> {
  if (!adminEndpoint || !adminToken) {
    return { success: false, error: "admin API not configured" };
  }

  // Look up customer by email in Admin API to get the correct admin GID
  const searchResult = await shopifyAdminFetch<{
    customers: { edges: { node: { id: string; tags: string[] } }[] };
  }>(
    `query customers($query: String!) {
      customers(first: 1, query: $query) {
        edges { node { id tags } }
      }
    }`,
    { query: `email:${customerEmail}` },
  );

  const adminCustomer = searchResult.customers.edges[0]?.node;
  if (!adminCustomer) {
    return { success: false, error: "customer not found in admin" };
  }

  const existingTags = adminCustomer.tags || [];
  const filteredTags = existingTags.filter((t) => !t.startsWith("dob:"));
  const newTags = [...filteredTags, `dob:${dob}`];

  await shopifyAdminFetch<{
    customerUpdate: {
      customer: { id: string } | null;
      userErrors: { message: string }[];
    };
  }>(
    `mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer { id }
        userErrors { message }
      }
    }`,
    { input: { id: adminCustomer.id, tags: newTags } },
  );

  return { success: true };
}

export async function createCustomerAccount(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  acceptsMarketing?: boolean,
  dob?: string,
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
        acceptsMarketing: acceptsMarketing || false,
      },
    },
  );

  const errors = data.customerCreate.customerUserErrors;
  if (errors.length > 0) {
    return {
      success: false,
      error: errors[0]?.message || "failed to create account",
    };
  }

  // Set DOB via Admin API tags (Storefront API doesn't support tags)
  // Retry with delay since Shopify may not have indexed the new customer yet
  if (dob) {
    const setDob = async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 2000 * attempt));
        const result = await updateCustomerTag(email, "dob", dob);
        if (result.success) return;
      }
    };
    setDob().catch(() => {});
  }

  return { success: true };
}

export async function authenticateCustomer(
  email: string,
  password: string,
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
    { input: { email, password } },
  );

  return data.customerAccessTokenCreate.customerAccessToken;
}

export async function activateCustomerByUrl(
  activationUrl: string,
  password: string,
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
    { activationUrl, password },
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

export async function resetCustomerByUrl(
  resetUrl: string,
  password: string,
): Promise<{ accessToken: string; expiresAt: string } | { error: string }> {
  if (!endpoint) return { error: "store not configured" };

  const data = await shopifyCustomerFetch<{
    customerResetByUrl: {
      customerAccessToken: {
        accessToken: string;
        expiresAt: string;
      } | null;
      customerUserErrors: { code: string; message: string }[];
    };
  }>(
    `mutation customerResetByUrl($resetUrl: URL!, $password: String!) {
      customerResetByUrl(resetUrl: $resetUrl, password: $password) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { code message }
      }
    }`,
    { resetUrl, password },
  );

  const errors = data.customerResetByUrl.customerUserErrors;
  if (errors.length > 0) {
    return { error: errors[0]?.message || "failed to reset password" };
  }

  const tokenData = data.customerResetByUrl.customerAccessToken;
  if (!tokenData) {
    return { error: "failed to reset password" };
  }

  return { accessToken: tokenData.accessToken, expiresAt: tokenData.expiresAt };
}

export async function updateCustomer(
  accessToken: string,
  input: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    acceptsMarketing?: boolean;
  },
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
    { customerAccessToken: accessToken, customer: input },
  );

  const errors = data.customerUpdate.customerUserErrors;
  if (errors.length > 0) {
    return {
      success: false,
      error: errors[0]?.message || "failed to update profile",
    };
  }
  return { success: true };
}

export async function recoverCustomerPassword(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  if (!endpoint) return { success: false, error: "store not configured" };

  await shopifyCustomerFetch<{
    customerRecover: {
      customerUserErrors: { code: string; message: string }[];
    };
  }>(
    `mutation customerRecover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors { code message }
      }
    }`,
    { email },
  );

  // Always return success to avoid leaking whether an email exists
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
  numberOfOrders: number;
  totalSpent: string;
  dob: string | null;
  theme: string | null;
  globalTheme: boolean;
  isAthlete: boolean;
  isAdmin: boolean;
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
      orders: {
        edges: { node: { totalPrice: { amount: string } } }[];
      };
    } | null;
  }>(
    `query customer($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id email firstName lastName displayName phone acceptsMarketing createdAt
        orders(first: 100) {
          edges { node { totalPrice { amount } } }
        }
      }
    }`,
    { customerAccessToken: accessToken },
  );

  if (!data.customer) return null;

  const orders = data.customer.orders.edges;
  const totalSpent = orders
    .reduce(
      (sum, edge) => sum + parseFloat(edge.node.totalPrice.amount || "0"),
      0,
    )
    .toFixed(2);

  // Fetch customer tags via Admin API (Storefront API doesn't expose tags)
  let dob: string | null = null;
  let theme: string | null = null;
  let globalTheme = false;
  let isAthlete = false;
  let isAdmin = false;
  if (adminEndpoint && adminToken) {
    try {
      const adminCustomer = await shopifyAdminFetch<{
        customers: { edges: { node: { id: string; tags: string[] } }[] };
      }>(
        `query customers($query: String!) {
          customers(first: 1, query: $query) {
            edges { node { id tags } }
          }
        }`,
        { query: `email:${data.customer.email}` },
      );
      const tags = adminCustomer.customers.edges[0]?.node?.tags || [];
      const dobTag = tags.find((t) => t.startsWith("dob:"));
      dob = dobTag ? dobTag.replace("dob:", "") : null;
      const themeTag = tags.find((t) => t.startsWith("theme:"));
      theme = themeTag ? themeTag.replace("theme:", "") : null;
      globalTheme = tags.includes("globaltheme:on");
      isAthlete = tags.includes("tier:athlete");
      isAdmin = tags.includes("tier:admin");
    } catch {
      // Tags not available
    }
  }

  return {
    id: data.customer.id,
    email: data.customer.email,
    firstName: data.customer.firstName,
    lastName: data.customer.lastName,
    displayName: data.customer.displayName,
    phone: data.customer.phone,
    acceptsMarketing: data.customer.acceptsMarketing,
    createdAt: data.customer.createdAt,
    numberOfOrders: orders.length,
    totalSpent,
    dob,
    theme,
    globalTheme,
    isAthlete,
    isAdmin,
  };
}
