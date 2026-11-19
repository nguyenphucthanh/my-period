export const NAV_ITEMS = [
  { href: "/", label: "Trang chủ" },
  { href: "/cycle-analysis", label: "Phân tích chu kỳ" },
] as const;

/** Exact match for "/", prefix match for nested routes. */
export function isActiveNav(href: string, pathname: string): boolean {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}
