import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match internationalized pathnames, skipping internal paths and API routes
  matcher: ["/", "/(fa|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
