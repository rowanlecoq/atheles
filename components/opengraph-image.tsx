import { ImageResponse } from "next/og";
import { join } from "path";
import { readFile } from "fs/promises";

export type Props = {
  title?: string;
};

export default async function OpengraphImage(
  props?: Props,
): Promise<ImageResponse> {
  const { title } = {
    ...{
      title: process.env.SITE_NAME || "ATHELES",
    },
    ...props,
  };

  const file = await readFile(join(process.cwd(), "./fonts/Inter-Bold.ttf"));
  const font = Uint8Array.from(file).buffer;

  return new ImageResponse(
    (
      <div
        tw="flex h-full w-full flex-col items-center justify-center"
        style={{ backgroundColor: "#1A1A1A" }}
      >
        {/* Decorative border */}
        <div
          tw="absolute inset-4 border-2 rounded-lg"
          style={{ borderColor: "#7F6F4C40" }}
        />

        {/* Brand name */}
        <p
          tw="text-7xl font-bold tracking-widest"
          style={{ color: "#CCB173", letterSpacing: "0.2em" }}
        >
          ATHELES
        </p>

        {/* Decorative divider */}
        <div tw="flex items-center mt-4 mb-6">
          <div tw="w-16 h-px" style={{ backgroundColor: "#7F6F4C" }} />
          <p tw="mx-4 text-lg" style={{ color: "#7F6F4C" }}>
            ◆
          </p>
          <div tw="w-16 h-px" style={{ backgroundColor: "#7F6F4C" }} />
        </div>

        {/* Page title or tagline */}
        <p
          tw="text-2xl"
          style={{
            color: "#B09E73",
            letterSpacing: "0.15em",
          }}
        >
          {title === "ATHELES" ? "AUTHENTIC SUPERIORITY" : title}
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: font,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
