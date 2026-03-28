export const customerCreateMutation = /* GraphQL */ `
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        acceptsMarketing
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

export const customerAccessTokenCreateMutation = /* GraphQL */ `
  mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

export const customerQuery = /* GraphQL */ `
  query customer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      email
      firstName
      lastName
      displayName
      createdAt
    }
  }
`;
