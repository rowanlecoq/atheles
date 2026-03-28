import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  authenticateCustomer,
  getCustomerByToken,
} from "lib/auth/shopify-customer";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        const tokenResult = await authenticateCustomer(email, password);
        if (!tokenResult) return null;

        const customer = await getCustomerByToken(tokenResult.accessToken);
        if (!customer) return null;

        return {
          id: customer.id,
          email: customer.email,
          name: customer.displayName || customer.firstName || email.split("@")[0],
          image: null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
