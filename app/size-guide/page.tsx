import Footer from "components/layout/footer";
import SizeGuidePage from "components/size-guide";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "size guide",
  description:
    "find your perfect fit with the ATHELES size guide. detailed measurements for compressions, tees, oversized tops, and sweatpants.",
};

export default function Page() {
  return (
    <>
      <SizeGuidePage />
      <Footer />
    </>
  );
}
