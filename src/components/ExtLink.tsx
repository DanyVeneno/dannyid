import type { AnchorHTMLAttributes } from "react";
import { safeUrl } from "../data";

/** Enlace externo seguro: solo https, sin window.opener y sin Referer. */
export function extProps(href: string): AnchorHTMLAttributes<HTMLAnchorElement> {
  return { href: safeUrl(href), target: "_blank", rel: "noopener noreferrer" };
}

export default function ExtLink({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a {...extProps(href)} {...rest} />;
}
