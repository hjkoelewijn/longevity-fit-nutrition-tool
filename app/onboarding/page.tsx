import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { mapProfileRowToSnapshot } from "@/lib/onboarding-map";
import OnboardingClient from "./onboarding-client";

export const dynamic = "force-dynamic";

export default async function OnboardingPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: row } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const snapshot = mapProfileRowToSnapshot(row as Record<string, unknown> | null | undefined);

  const stepRaw = searchParams.step;
  const stepParam =
    typeof stepRaw === "string" ? Number.parseInt(stepRaw, 10) : Number.NaN;

  const initialStep =
    Number.isFinite(stepParam) && stepParam >= 1 && stepParam <= 7
      ? stepParam
      : snapshot.step;

  const fromProfile = searchParams.from === "profile";

  return (
    <OnboardingClient
      initialStep={initialStep}
      snapshot={snapshot}
      fromProfile={fromProfile}
    />
  );
}
