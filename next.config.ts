export default {
  experimental: {
    ppr: true,
    inlineCss: true,
    useCache: true,
  },
  redirects: async () => [
    {
      source: "/search/t-shirts",
      destination: "/search/tees",
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
    ],
  },
};
