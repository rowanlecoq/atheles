export default function AccountDashboard() {
  return (
    <div>
      <h2 className="mb-6 font-heading text-2xl text-brand-light-gold">
        Dashboard
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6">
          <h3 className="mb-2 text-xs uppercase tracking-wider text-brand-gold">
            Recent Orders
          </h3>
          <p className="text-sm text-brand-grey">
            No orders yet. Start shopping to see your order history here.
          </p>
        </div>
        <div className="rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6">
          <h3 className="mb-2 text-xs uppercase tracking-wider text-brand-gold">
            Wishlist
          </h3>
          <p className="text-sm text-brand-grey">
            Your wishlist is empty. Browse our collection and save items you
            love.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-brand-dark-gold/20 bg-brand-dark p-6">
        <h3 className="mb-4 text-xs uppercase tracking-wider text-brand-gold">
          Account Details
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-brand-dark-gold/10 pb-3">
            <span className="text-brand-grey">Name</span>
            <span className="text-white">—</span>
          </div>
          <div className="flex justify-between border-b border-brand-dark-gold/10 pb-3">
            <span className="text-brand-grey">Email</span>
            <span className="text-white">—</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-grey">Member Since</span>
            <span className="text-white">—</span>
          </div>
        </div>
      </div>
    </div>
  );
}
