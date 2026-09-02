export function WavyDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 8"
      preserveAspectRatio="none"
      className={`block w-full ${className}`}
      style={{ height: 8 }}
      aria-hidden="true"
    >
      <path
        d="M0,4 C50,2 150,6 200,4 C250,2 350,6 400,4 C450,2 550,6 600,4 C650,2 750,6 800,4 C850,2 950,6 1000,4 C1050,2 1150,6 1200,4"
        stroke="rgba(204,177,115,0.2)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
