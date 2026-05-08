import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function hasNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function isOnboardingComplete(profile: Record<string, unknown> | null | undefined) {
  if (!profile) return false;

  const eatingPattern = profile.eating_pattern;
  const gutStatus = profile.gut_status;
  const goals = profile.goals;

  const baseComplete =
    hasNonEmptyString(profile.name) &&
    typeof profile.age === "number" &&
    typeof profile.household_adults === "number" &&
    eatingPattern &&
    typeof eatingPattern === "object" &&
    hasNonEmptyString(profile.diet_style) &&
    hasNonEmptyString(profile.food_experience) &&
    gutStatus &&
    typeof gutStatus === "object" &&
    hasNonEmptyString(profile.dairy_approach) &&
    hasNonEmptyString(profile.gluten_approach) &&
    hasNonEmptyString(profile.coffee_intake) &&
    hasNonEmptyString(profile.alcohol_intake) &&
    hasNonEmptyString(profile.cycle_status) &&
    Array.isArray(goals) &&
    goals.length > 0 &&
    hasNonEmptyString(profile.balance_test_choice);

  if (!baseComplete) return false;

  const cycleStatus = String(profile.cycle_status);
  if (cycleStatus === "cyclisch") {
    if (!profile.cycle_last_period) return false;
    if (typeof profile.cycle_length !== "number") return false;
  }

  if (profile.balance_test_choice === "entered") {
    // presence of a balance test row is verified separately (async) by caller
    return true;
  }

  return true;
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

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
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isSetPasswordPage = pathname.startsWith("/auth/set-password");
  const isAuthPage = pathname.startsWith("/login") || (pathname.startsWith("/auth") && !isSetPasswordPage);
  const isOnboardingPage = pathname.startsWith("/onboarding");
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/recipes") ||
    pathname.startsWith("/leren") ||
    pathname.startsWith("/kennisbank") ||
    pathname.startsWith("/over") ||
    pathname.startsWith("/richtlijnen") ||
    pathname.startsWith("/weekplan");

  if (isProtectedPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isSetPasswordPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname === "/" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "name,age,household_adults,eating_pattern,diet_style,food_experience,gut_status,dairy_approach,gluten_approach,coffee_intake,alcohol_intake,cycle_status,cycle_last_period,cycle_length,goals,balance_test_choice",
      )
      .eq("id", user.id)
      .maybeSingle();

    let onboardingDone = isOnboardingComplete(
      profile as unknown as Record<string, unknown> | null | undefined,
    );

    if (
      onboardingDone &&
      profile &&
      (profile as { balance_test_choice?: string }).balance_test_choice ===
        "entered"
    ) {
      const { data: testRow, error: testError } = await supabase
        .from("balance_tests")
        .select("id")
        .eq("user_id", user.id)
        .order("test_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (testError || !testRow) {
        onboardingDone = false;
      }
    }

    if (isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = onboardingDone ? "/dashboard" : "/onboarding";
      return NextResponse.redirect(url);
    }

    if (
      !onboardingDone &&
      (pathname.startsWith("/dashboard") ||
        pathname.startsWith("/recipes") ||
        pathname.startsWith("/leren") ||
        pathname.startsWith("/kennisbank") ||
        pathname.startsWith("/over") ||
        pathname.startsWith("/richtlijnen") ||
        pathname.startsWith("/weekplan"))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    const fromProfile = request.nextUrl.searchParams.get("from") === "profile";

    if (onboardingDone && isOnboardingPage && !fromProfile) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
