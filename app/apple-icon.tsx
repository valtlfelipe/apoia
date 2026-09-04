import { ImageResponse } from "next/og";
import { BRAND_INDIGO, HEART_PATH, HEART_VIEWBOX } from "@/lib/brand";

/**
 * Raster version of the mark in app/icon.svg, served at `/apple-icon` — for
 * iOS home screens, and for anywhere that wants an image URL and won't take an
 * SVG (a Railway template icon, for instance).
 *
 * Squared off on purpose: iOS applies its own rounded mask, and our own
 * corner radius on top of that reads as a double-rounded tile. The favicon
 * keeps its radius because nothing masks that one.
 *
 * The shape comes from lib/brand.ts, not from reading app/icon.svg: the
 * standalone build output doesn't ship the `app/` sources, so an fs read of
 * that file would work locally and 500 inside the Docker image.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const alt = "apoia";

// Satori takes an <img> with a data URI, so the heart goes in as its own
// standalone SVG document rather than as JSX children.
const HEART = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${HEART_VIEWBOX}"><path d="${HEART_PATH}" fill="#fff"/></svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: BRAND_INDIGO,
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: Satori renders this to a
          PNG on the server — next/image doesn't exist in that renderer. */}
      <img
        src={`data:image/svg+xml;base64,${Buffer.from(HEART).toString("base64")}`}
        width={96}
        height={76}
        alt=""
      />
    </div>,
    size,
  );
}
