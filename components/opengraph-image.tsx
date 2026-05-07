import { ImageResponse } from "next/og";
import { join } from "path";
import { readFile } from "fs/promises";

export type Props = {
  title?: string;
};

export default async function OpengraphImage(
  props?: Props,
): Promise<ImageResponse> {
  const logoData = await readFile(join(process.cwd(), "./public/logo-icon.png"));
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        tw="flex h-full w-full items-center justify-center"
        style={{ backgroundColor: "#1a1a1a" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          width={800}
          height={343}
          alt="Atheles"
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
