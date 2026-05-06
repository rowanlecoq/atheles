export default function Loading() {
  return (
    <>
      <div className="mb-4 h-6" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {Array(8)
          .fill(0)
          .map((_, index) => (
            <div key={index} className="aspect-[3/4] rounded-lg border border-brand-dark-gold/20 bg-white/[0.04]" />
          ))}
      </div>
    </>
  );
}
