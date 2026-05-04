import type { ImgHTMLAttributes } from "react";

import styles from "./Icon.module.css";

export const ICON_SRC = {
  calendar: "/icons/calendar.svg",
  crew: "/icons/crew.svg",
  down: "/icons/down.svg",
  home: "/icons/home.svg",
  left: "/icons/left.svg",
  log: "/icons/log.svg",
  minus: "/icons/minus.svg",
  mypage: "/icons/mypage.svg",
  people: "/icons/people.svg",
  plus: "/icons/plus.svg",
  right: "/icons/right.svg",
  up: "/icons/up.svg",
} as const;

export type IconName = keyof typeof ICON_SRC;

type IconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt" | "src"> & {
  name: IconName;
  alt?: string;
  decorative?: boolean;
};

export function Icon({
  alt,
  className,
  decorative = false,
  name,
  ...props
}: IconProps) {
  return (
    // SVG icon assets are served directly from public/icons so they can be reused
    // without requiring fixed Next image sizing props at every call site.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      src={ICON_SRC[name]}
      alt={decorative ? "" : alt ?? name}
      aria-hidden={decorative ? true : undefined}
      className={[styles.icon, className].filter(Boolean).join(" ")}
    />
  );
}
