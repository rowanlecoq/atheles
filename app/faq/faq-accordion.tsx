"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

export function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-brand-medium-grey/10"
          >
            <span className="pr-4 text-sm font-medium text-brand-pale-gold">
              {faq.question}
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 flex-shrink-0 text-brand-gold transition-transform duration-200 ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          {openIndex === index && (
            <div className="border-t border-brand-dark-gold/10 px-6 py-4">
              <p className="text-sm leading-relaxed text-brand-grey">
                {faq.answer}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
