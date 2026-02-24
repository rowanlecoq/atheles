export default function WishlistPage() {
  return (
    <div>
      <h2 className="mb-6 font-heading text-2xl text-brand-light-gold">
        Wishlist
      </h2>
      <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-8 text-center">
        <p className="mb-2 text-sm text-brand-grey">
          Your wishlist is empty. Browse our collection and save items you love.
        </p>
        <a
          href="/search"
          className="inline-block mt-4 rounded bg-brand-gold px-6 py-2.5 font-heading text-sm uppercase tracking-wider text-brand-dark transition-colors hover:bg-brand-light-gold"
        >
          Browse Collection
        </a>
      </div>
    </div>
  );
}
