"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto my-4 flex max-w-xl flex-col rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8 md:p-12">
      <h2 className="font-heading text-xl font-bold text-brand-gold">
        Oh no!
      </h2>
      <p className="my-2 text-brand-grey">
        There was an issue with our storefront. This could be a temporary issue,
        please try your action again.
      </p>
      <button
        className="mx-auto mt-4 flex w-full items-center justify-center rounded-full bg-brand-gold p-4 font-heading uppercase tracking-wider text-brand-dark hover:opacity-90 transition-opacity"
        onClick={() => reset()}
      >
        Try Again
      </button>
    </div>
  );
}
