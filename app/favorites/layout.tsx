import Footer from "components/layout/footer";
import type { ReactNode } from "react";

export default function FavoritesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="min-h-[calc(100vh-200px)]">
        {children}
      </div>
      <Footer />
    </>
  );
}
