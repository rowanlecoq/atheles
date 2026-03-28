"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { GridTileImage } from "components/grid/tile";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export function Gallery({
  images,
}: {
  images: { src: string; altText: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageIndex = searchParams.has("image")
    ? parseInt(searchParams.get("image")!)
    : 0;

  const updateImage = (index: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("image", index);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const nextImageIndex = imageIndex + 1 < images.length ? imageIndex + 1 : 0;
  const previousImageIndex =
    imageIndex === 0 ? images.length - 1 : imageIndex - 1;

  const buttonClassName =
    "flex h-full items-center justify-center px-4 transition-all ease-in-out hover:scale-110 hover:text-brand-gold sm:px-6";

  return (
    <form>
      <div className="relative aspect-square h-full max-h-[460px] w-full overflow-hidden sm:max-h-[550px]">
        {images[imageIndex] && (
          <Image
            className="h-full w-full object-contain"
            fill
            sizes="(min-width: 1024px) 66vw, 100vw"
            alt={images[imageIndex]?.altText as string}
            src={images[imageIndex]?.src as string}
            priority={true}
          />
        )}

        {images.length > 1 ? (
          <div className="absolute bottom-4 flex w-full justify-center sm:bottom-[15%]">
            <div className="mx-auto flex h-11 items-center rounded-full border border-brand-dark-gold/30 bg-brand-dark/80 text-brand-grey backdrop-blur-sm">
              <button
                formAction={() => updateImage(previousImageIndex.toString())}
                aria-label="Previous product image"
                className={buttonClassName}
              >
                <ArrowLeftIcon className="h-5" />
              </button>
              <div className="mx-1 h-6 w-px bg-brand-medium-grey"></div>
              <button
                formAction={() => updateImage(nextImageIndex.toString())}
                aria-label="Next product image"
                className={buttonClassName}
              >
                <ArrowRightIcon className="h-5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="my-8 flex w-full flex-nowrap items-center justify-start gap-2 overflow-x-auto py-1 sm:my-12 sm:flex-wrap sm:justify-center lg:mb-0">
          {images.map((image, index) => {
            const isActive = index === imageIndex;

            return (
              <li
                key={image.src}
                className="h-16 w-16 flex-none sm:h-20 sm:w-20"
              >
                <button
                  formAction={() => updateImage(index.toString())}
                  aria-label="Select product image"
                  className="h-full w-full"
                >
                  <GridTileImage
                    alt={image.altText}
                    src={image.src}
                    width={80}
                    height={80}
                    active={isActive}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </form>
  );
}
