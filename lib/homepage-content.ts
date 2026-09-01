import { unstable_cache } from "next/cache";
import { readMetafield } from "lib/admin/utils";

export type HomepageContent = {
  carouselTitle: string;
  carouselSubtitle: string;
  carouselViewAllHref: string;
  featuredTitle: string;
};

export const HOMEPAGE_CONTENT_DEFAULTS: HomepageContent = {
  carouselTitle: "Coming Soon: This Summer",
  carouselSubtitle: "mens",
  carouselViewAllHref: "/search",
  featuredTitle: "best selling",
};

export const getHomepageContent = unstable_cache(
  async (): Promise<HomepageContent> => {
    try {
      const saved = await readMetafield("homepage_content") as Partial<HomepageContent> | null;
      return { ...HOMEPAGE_CONTENT_DEFAULTS, ...saved };
    } catch {
      return HOMEPAGE_CONTENT_DEFAULTS;
    }
  },
  ["homepage_content"],
  { revalidate: 60, tags: ["homepage_content"] },
);
