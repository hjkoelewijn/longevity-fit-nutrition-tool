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
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const redirectUrl = new URL(next, origin).toString();

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
      `${origin}/login?error=auth_failed&reason=${encodeURIComponent(error.message)}`,
    );
  }

  // OTP / magic-link flow: ?token_hash=...&type=...
  if (tokenHash && type) {
    const otpType = VALID_EMAIL_OTP_TYPES.has(type) ? type : "magiclink";
    const { error } = await supabase.auth.verifyOtp({
      type: otpType as "magiclink",
      token_hash: tokenHash,
    });

    if (!error) {
      return response;
    }
    return NextResponse.redirect(
      `${origin}/login?error=auth_failed&reason=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed&reason=missing_token`);
}
