export default {
  experimental: {
    useCache: true,
  },
  redirects: async () => [
    {
      source: "/search/t-shirts",
      destination: "/search/tees",
      permanent: true,
    },
    {
      source: "/products/:handle",
      destination: "/product/:handle",
      permanent: true,
    },
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [{ pathname: "/statues/**" }, { pathname: "/*" }],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};
