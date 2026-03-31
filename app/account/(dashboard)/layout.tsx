import Footer from "components/layout/footer";
import { AccountNav } from "./account-nav";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto min-h-[calc(100vh-200px)] max-w-5xl px-4 py-10 sm:py-12">
        <div className="flex flex-col gap-8 md:flex-row">
          <AccountNav />
          <div className="min-h-[400px] flex-1">{children}</div>
        </div>
      </div>
      <Footer />
    </>
  );
}
