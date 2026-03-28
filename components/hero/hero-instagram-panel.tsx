import { FadeIn } from "components/animations";
import Image from "next/image";

export function HeroInstagramPanel() {
  return (
    <FadeIn delay={0.3} direction="left" className="h-full">
      <a
        href="https://www.instagram.com/atheles.co/"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex h-full flex-col overflow-hidden rounded-sm border border-brand-dark-gold/25 bg-[#1e1e1e]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-dark-gold/15 px-4 py-2.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-brand-dark-gold">
            @atheles.co
          </span>
          <span className="text-[9px] uppercase tracking-[0.15em] text-brand-gold transition-colors group-hover:text-brand-light-gold">
            follow
          </span>
        </div>

        {/* Image */}
        <div className="relative flex-1 overflow-hidden">
          <Image
            src="/statues/doryphoros.jpg"
            alt="atheles instagram"
            fill
            className="object-cover opacity-50 grayscale transition-all duration-700 group-hover:opacity-70 group-hover:grayscale-0"
            sizes="(min-width: 768px) 25vw, 0px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/20 to-transparent" />

          {/* Instagram icon + handle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <svg
              className="h-8 w-8 text-brand-dark-gold/70 transition-colors duration-300 group-hover:text-brand-gold"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-label="Instagram"
              role="img"
            >
              <title>Instagram</title>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </div>

          {/* Bottom label */}
          <div className="absolute bottom-3 left-4 right-4 text-center">
            <p className="text-[9px] uppercase tracking-[0.2em] text-brand-dark-gold/80">
              follow the journey
            </p>
          </div>
        </div>
      </a>
    </FadeIn>
  );
}
