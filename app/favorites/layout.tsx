import Footer from "components/layout/footer";
import type { ReactNode } from "react";

export default function FavoritesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
