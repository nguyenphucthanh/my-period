import { convexAuthNextjsProxy, nextjsProxyRedirect } from "@/lib/convexAuth";
import { getRedirectPath } from "@/lib/routeAccess";

export default convexAuthNextjsProxy(async (request, { isAuthenticated }) => {
  const redirectPath = getRedirectPath(
    request.nextUrl.pathname,
    await isAuthenticated(),
  );
  if (redirectPath !== null) {
    return nextjsProxyRedirect(request, redirectPath);
  }
});

export const config = {
  // Run on all routes except static assets and the `/auth` route handlers,
  // which set their own cookies.
  matcher: ["/((?!auth(?:/|$)|.*\\..*|_next).*)", "/"],
};
