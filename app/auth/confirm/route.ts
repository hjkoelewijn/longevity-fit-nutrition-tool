import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const VALID_EMAIL_OTP_TYPES = new Set([
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
  "email",
]);

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const configuredAppOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");

  // Critical for auth cookies: if confirm lands on a Vercel hostname but
  // our canonical app lives on a custom domain, first hop to that domain
  // with the exact same params. Then exchange code/token there so cookies
  // are issued for the correct host.
  if (configuredAppOrigin && origin !== configuredAppOrigin && origin.includes(".vercel.app")) {
    const canonicalConfirmUrl = new URL("/auth/confirm", configuredAppOrigin);
    searchParams.forEach((value, key) => {
      canonicalConfirmUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(canonicalConfirmUrl.toString());
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash") ?? searchParams.get("token");
  const type = searchParams.get("type") ?? "magiclink";
  const isFirstTime = searchParams.get("first_time") === "1";
  const next = isFirstTime ? "/auth/set-password" : (searchParams.get("next") ?? "/dashboard");
  const appOrigin =
    configuredAppOrigin || (origin.includes(".vercel.app") ? "https://app.longevityfit.nl" : origin);

  const redirectUrl = new URL(next, appOrigin).toString();

  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as CookieOptions);
          });
        },
      },
    },
  );

  // PKCE flow (common): ?code=...
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
    return NextResponse.redirect(
      `${appOrigin}/login?error=auth_failed&reason=${encodeURIComponent(error.message)}`,
    );
  }

  // OTP / magic-link flow: token_hash/token + type
  if (tokenHash) {
    const otpType = VALID_EMAIL_OTP_TYPES.has(type) ? type : "magiclink";
    const { error } = await supabase.auth.verifyOtp({
      // Supabase expects a specific union; we accept multiple via runtime string.
      type: otpType as "magiclink",
      token_hash: tokenHash,
    });

    if (!error) {
      return response;
    }
    return NextResponse.redirect(
      `${appOrigin}/login?error=auth_failed&reason=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${appOrigin}/login?error=auth_failed&reason=missing_token`);
}
