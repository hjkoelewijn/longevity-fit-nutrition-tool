import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/onboarding/:path*",
    "/dashboard/:path*",
    "/profile",
    "/profile/:path*",
    "/recipes",
    "/recipes/:path*",
    "/leren",
    "/leren/:path*",
    "/kennisbank",
    "/kennisbank/:path*",
    "/over",
    "/over/:path*",
    "/richtlijnen",
    "/richtlijnen/:path*",
    "/inspiratie",
    "/inspiratie/:path*",
    "/weekplan",
    "/weekplan/:path*",
    "/auth/:path*",
  ],
};
