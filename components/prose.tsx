import clsx from "clsx";

const Prose = ({ html, className }: { html: string; className?: string }) => {
  return (
    <div
      className={clsx(
        "prose mx-auto max-w-6xl text-sm leading-7 text-brand-grey sm:text-base prose-headings:mt-6 sm:prose-headings:mt-8 prose-headings:break-words prose-headings:font-semibold prose-headings:leading-tight prose-headings:tracking-wide prose-headings:text-brand-light-gold prose-h1:text-3xl sm:prose-h1:text-4xl md:prose-h1:text-5xl prose-h2:text-2xl sm:prose-h2:text-3xl md:prose-h2:text-4xl prose-h3:text-xl sm:prose-h3:text-2xl md:prose-h3:text-3xl prose-h4:text-lg sm:prose-h4:text-xl md:prose-h4:text-2xl prose-h5:text-base sm:prose-h5:text-lg md:prose-h5:text-xl prose-h6:text-sm sm:prose-h6:text-base md:prose-h6:text-lg prose-a:text-brand-gold prose-a:underline hover:prose-a:text-brand-light-gold prose-strong:text-white prose-ol:mt-6 sm:prose-ol:mt-8 prose-ol:list-decimal prose-ol:pl-6 prose-ul:mt-6 sm:prose-ul:mt-8 prose-ul:list-disc prose-ul:pl-6 prose-pre:overflow-x-auto",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default Prose;
