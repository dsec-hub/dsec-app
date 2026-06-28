import Image from "next/image";

export type DuckName =
  | "duck-mascot"
  | "duck-laptop"
  | "duck-wave"
  | "duck-trophy"
  | "duck-rocket"
  | "duck-coffee"
  | "duck-mail"
  | "duck-iso"
  | "hero-banner"
  | "hero-party"
  | "hero-desk"
  | "hero-iso-island"
  | "hero-iso-arcade"
  | "icon-star"
  | "icon-heart"
  | "icon-floppy"
  | "icon-cursor"
  | "icon-controller";

/**
 * Fixed-size sprite - use for 2-column scenes, mascots and icons.
 *
 * By default the sprite keeps its natural aspect ratio (`width: size`,
 * `height: auto`), so different sprites end up different heights. Pass `square`
 * to lock it into a `size`×`size` box and `object-contain` the artwork — use
 * this when several sprites sit in a row (e.g. dashboard tiles) and must share
 * an identical footprint. Contain never distorts; it just letterboxes.
 */
export function PixelDuck({
  name,
  alt,
  size = 160,
  className = "",
  priority = false,
  bob = false,
  square = false,
}: {
  name: DuckName;
  alt: string;
  size?: number;
  className?: string;
  priority?: boolean;
  bob?: boolean;
  square?: boolean;
}) {
  return (
    <Image
      src={`/pixel/${name}.webp`}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={`pixelated select-none ${bob ? "animate-bob" : ""} ${className}`}
      style={square ? { width: size, height: size, objectFit: "contain" } : { width: size, height: "auto" }}
    />
  );
}

/**
 * Full-bleed banner - the illustration covers the COMPLETE width of the page
 * and crops vertically into a responsive band. Use for hero sections only
 * (fixed-size PixelDuck stays for everything else). Drop it inside a full-width
 * parent; it stretches edge-to-edge on its own.
 */
export function PixelBanner({
  name,
  alt,
  priority = false,
  className = "",
  contain = false,
  width = 1531,
  height = 872,
}: {
  name: DuckName;
  alt: string;
  priority?: boolean;
  className?: string;
  /** Show the whole illustration at its natural aspect - never crop it.
   *  Use for transparent scenes where every element must stay in frame. */
  contain?: boolean;
  width?: number;
  height?: number;
}) {
  if (contain) {
    return (
      <Image
        src={`/pixel/${name}.webp`}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes="100vw"
        className={`pixelated pointer-events-none mx-auto block h-auto w-full select-none ${className}`}
      />
    );
  }
  return (
    <div
      className={`relative w-full h-[42vh] min-h-[300px] sm:h-[54vh] lg:h-[62vh] ${className}`}
    >
      <Image
        src={`/pixel/${name}.webp`}
        alt={alt}
        fill
        priority={priority}
        sizes="100vw"
        className="pixelated select-none object-cover object-center"
      />
    </div>
  );
}
