import Footer from "components/layout/footer";
import SizeGuidePage from "components/size-guide";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "size guide",
  description:
    "Find your perfect fit with the ATHELES size guide. Detailed measurements for compressions, regular tops, oversized tops, and sweatpants.",
};

export default function Page() {
  return (
    <>
      <SizeGuidePage />
      <Footer />
    </>
  );
}
