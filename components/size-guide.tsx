"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { sizeCategories, fitGuide } from "lib/size-data";
import { useEffect, useState } from "react";
import { FadeIn } from "components/animations";

export function SizeGuideButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 text-xs uppercase tracking-wider text-brand-grey underline underline-offset-4 hover:text-brand-gold transition-colors"
      >
        Size Guide
      </button>
      {open && <SizeGuideModal onClose={() => setOpen(false)} />}
    </>
  );
}

function SizeGuideModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-lg border border-brand-dark-gold/30 bg-brand-dark shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-dark-gold/20 px-6 py-4">
          <h2 className="font-heading text-xl uppercase tracking-wider text-brand-gold">
            Size Guide
          </h2>
          <button
            onClick={onClose}
            className="text-brand-grey hover:text-brand-gold transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-brand-dark-gold/20 px-6">
          {sizeCategories.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveTab(i)}
              className={`whitespace-nowrap px-4 py-3 text-xs uppercase tracking-wider transition-colors ${
                activeTab === i
                  ? "border-b-2 border-brand-gold text-brand-gold"
                  : "text-brand-grey hover:text-brand-pale-gold"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto p-6"
          style={{ maxHeight: "calc(85vh - 130px)" }}
        >
          <SizeTable category={sizeCategories[activeTab]!} />
          {fitGuide[activeTab] && (
            <div className="mt-6 rounded border border-brand-dark-gold/20 bg-brand-medium-grey/10 p-4">
              <h4 className="mb-1 text-xs uppercase tracking-wider text-brand-pale-gold">
                Fit: {fitGuide[activeTab]!.fit}
              </h4>
              <p className="text-xs text-brand-grey">
                {fitGuide[activeTab]!.description}
              </p>
            </div>
          )}
          <p className="mt-4 text-xs text-brand-grey/60">
            All measurements are in inches. For the best fit, measure a garment
            you already own and compare to the chart above.
          </p>
        </div>
      </div>
    </div>
  );
}

function SizeTable({
  category,
}: {
  category: (typeof sizeCategories)[number];
}) {
  const sizes = Object.keys(category.sizes);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-brand-dark-gold/30">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-brand-pale-gold">
                Size
              </th>
              {category.columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs uppercase tracking-wider text-brand-pale-gold"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizes.map((size, si) => (
              <tr
                key={size}
                className={`border-b border-brand-dark-gold/10 transition-colors hover:bg-brand-dark-gold/10 ${
                  si % 2 === 0 ? "bg-brand-medium-grey/5" : ""
                }`}
              >
                <td className="px-4 py-3 font-heading text-base font-medium text-brand-gold">
                  {size}
                </td>
                {category.sizes[size]!.map((val, vi) => (
                  <td key={vi} className="px-4 py-3 text-white/90">
                    {val}&quot;
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SizeGuidePage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <FadeIn direction="up">
      <h1 className="mb-2 font-heading text-4xl text-brand-gold">Size Guide</h1>
      <p className="mb-8 text-sm text-brand-grey">
        All measurements are in inches. Find your perfect fit across our product
        categories.
      </p>
      </FadeIn>

      {/* Fit Overview */}
      <FadeIn direction="up" delay={0.05}>
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fitGuide.map((item) => (
          <div
            key={item.name}
            className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-5"
          >
            <h3 className="mb-1 font-heading text-sm uppercase tracking-wider text-brand-light-gold">
              {item.name}
            </h3>
            <p className="mb-2 text-xs text-brand-gold">{item.fit}</p>
            <p className="text-xs leading-relaxed text-brand-grey">
              {item.description}
            </p>
          </div>
        ))}
      </div>
      </FadeIn>

      <FadeIn direction="up" delay={0.1}>
      {/* Tabs */}
      <div className="mb-6 flex overflow-x-auto border-b border-brand-dark-gold/20">
        {sizeCategories.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setActiveTab(i)}
            className={`whitespace-nowrap px-4 py-3 text-xs uppercase tracking-wider transition-colors ${
              activeTab === i
                ? "border-b-2 border-brand-gold text-brand-gold"
                : "text-brand-grey hover:text-brand-pale-gold"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6">
        <SizeTable category={sizeCategories[activeTab]!} />
      </div>

      {/* How to Measure */}
      <div className="mt-10 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6">
        <h2 className="mb-4 font-heading text-xl text-brand-gold">
          How to Measure
        </h2>
        <ul className="space-y-3 text-sm text-brand-grey">
          <li>
            <strong className="text-brand-pale-gold">Chest:</strong> Measure
            around the fullest part of your chest, keeping the tape horizontal.
          </li>
          <li>
            <strong className="text-brand-pale-gold">Waist:</strong> Measure
            around your natural waistline, keeping the tape comfortably loose.
          </li>
          <li>
            <strong className="text-brand-pale-gold">Length:</strong> Measure
            from the highest point of the shoulder down to the hem.
          </li>
          <li>
            <strong className="text-brand-pale-gold">Inseam:</strong> Measure
            from the crotch seam to the bottom of the leg.
          </li>
          <li>
            <strong className="text-brand-pale-gold">Hip:</strong> Measure
            around the fullest part of your hips, about 8 inches below the
            waist.
          </li>
        </ul>
      </div>
      </FadeIn>
    </div>
  );
}
