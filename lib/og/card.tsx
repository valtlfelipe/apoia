import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * The shared Open Graph card, so /opengraph-image and /[product]/opengraph-image
 * stay one design rather than two that drift.
 *
 * Satori (what ImageResponse renders with) supports only flexbox and a subset
 * of CSS — every element with more than one child needs an explicit
 * `display: flex`, and there is no `grid`. Colors are literal hex rather than
 * the app's CSS variables, which don't exist in this renderer; they mirror the
 * light palette in app/globals.css.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const BRAND = "#5b5bd6";
const BRAND_SOFT = "#eeeefb";
const BRAND_INK = "#4038b8";
const INK = "#18181b";
const INK_MUTED = "#71717a";
const SURFACE = "#ffffff";
const SUBTLE = "#f1f1f4";

// Read once at module load, not per request. Static woff rather than the
// variable ttf Google ships: Satori renders a variable font at its default
// instance only, so a real bold needs its own file. Keep these paths as plain
// literals — that's what lets Next's tracer find them for the standalone
// build (the Dockerfile copies `assets/` too, belt and braces).
const fontsDir = join(process.cwd(), "assets", "fonts");
const [medium, extraBold] = await Promise.all([
  readFile(join(fontsDir, "plus-jakarta-sans-latin-500-normal.woff")),
  readFile(join(fontsDir, "plus-jakarta-sans-latin-800-normal.woff")),
]);

type OgCardProps = {
  /** The creator's avatar, already inlined as a data URI — see lib/og/avatar.ts. */
  avatar: string;
  /** The creator's name. This card sells the creator's page, not the software. */
  name: string;
  /** Small line after the name — the product name, when there is one. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function ogCard({ avatar, name, eyebrow, title, subtitle }: OgCardProps): ImageResponse {
  // Long headlines are the norm here ("Apoie X no desenvolvimento do Y"), so
  // step the size down instead of letting a third line push the card around.
  const titleSize = title.length > 62 ? 52 : title.length > 42 ? 60 : 72;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: SURFACE,
        padding: "72px 80px 84px",
        fontFamily: "Plus Jakarta Sans",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* biome-ignore lint/performance/noImgElement: Satori renders this to a
            PNG on the server — next/image doesn't exist in that renderer, and
            explicit dimensions are required here. */}
        <img
          src={avatar}
          width={64}
          height={64}
          alt=""
          // backgroundColor matters for the generated DiceBear fallback, whose
          // SVG is transparent — same light disc it sits on in the page header.
          style={{ borderRadius: 999, objectFit: "cover", backgroundColor: SUBTLE }}
        />
        <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: INK }}>{name}</div>
        {eyebrow ? (
          <div style={{ display: "flex", fontSize: 26, fontWeight: 500, color: INK_MUTED }}>
            {`· ${eyebrow}`}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div
          style={{
            display: "flex",
            fontSize: titleSize,
            fontWeight: 800,
            color: INK,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 500,
              color: INK_MUTED,
              lineHeight: 1.35,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            display: "flex",
            backgroundColor: BRAND_SOFT,
            color: BRAND_INK,
            borderRadius: 999,
            padding: "10px 24px",
            fontSize: 25,
            fontWeight: 800,
          }}
        >
          Pix
        </div>
        <div style={{ display: "flex", fontSize: 25, fontWeight: 500, color: INK_MUTED }}>
          Qualquer valor, sem cadastro
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 14,
          backgroundColor: BRAND,
        }}
      />
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Plus Jakarta Sans", data: medium, weight: 500, style: "normal" },
        { name: "Plus Jakarta Sans", data: extraBold, weight: 800, style: "normal" },
      ],
    },
  );
}
