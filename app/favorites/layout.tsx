import Footer from "components/layout/footer";
import type { ReactNode } from "react";

export default function FavoritesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="min-h-[calc(100vh-200px)] border-b border-brand-dark-gold/20">
        {children}
      </div>
      <Footer />
    </>
  );
}
