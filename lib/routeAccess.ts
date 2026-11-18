// Route access policy. Deny by default: every route requires authentication
// except the ones listed in `PUBLIC_PATHS`.
export const SIGN_IN_PATH = "/signin";
export const HOME_PATH = "/";

const PUBLIC_PATHS: readonly string[] = [SIGN_IN_PATH];

export function isPublicPath(pathname: string): boolean {
  // Tolerate a trailing slash (`/signin/`) but nothing else.
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  return PUBLIC_PATHS.includes(normalized);
}

/**
 * Returns the path to redirect to, or `null` to let the request through.
 * Signed-in users are bounced off the sign-in page; signed-out users are
 * bounced off everything else.
 */
export function getRedirectPath(
  pathname: string,
  isAuthenticated: boolean,
): string | null {
  if (isPublicPath(pathname)) {
    return isAuthenticated ? HOME_PATH : null;
  }
  return isAuthenticated ? null : SIGN_IN_PATH;
}
