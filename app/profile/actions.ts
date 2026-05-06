"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

function numericOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function updateProfileAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const age = Number(formData.get("age"));
  const householdAdults = Number(formData.get("household_adults"));
  const householdChildrenCount = Number(formData.get("household_children_count"));

  if (!name) {
    redirect("/profile?error=missing_name");
  }
  if (!Number.isFinite(age)) {
    redirect("/profile?error=invalid_age");
  }
  if (!Number.isFinite(householdAdults) || householdAdults < 1) {
    redirect("/profile?error=invalid_household_adults");
  }
  if (
    !Number.isFinite(householdChildrenCount) ||
    householdChildrenCount < 0 ||
    !Number.isInteger(householdChildrenCount)
  ) {
    redirect("/profile?error=invalid_household_children_count");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      name,
      age,
      household_adults: householdAdults,
      household_children_count: householdChildrenCount,
    },
    { onConflict: "id" },
  );

  if (error) {
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/profile");
  redirect("/profile?saved=profile");
}

export async function updateBalanceTestChoiceAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const choice = String(formData.get("balance_test_choice") ?? "");
  const allowed = new Set(["entered", "later", "none"]);
  if (!allowed.has(choice)) {
    redirect("/profile?error=invalid_balance_choice");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      balance_test_choice: choice,
    },
    { onConflict: "id" },
  );

  if (error) {
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/profile");
  redirect("/profile?saved=balance_choice");
}

export async function upsertLatestBalanceTestAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const testDate = String(formData.get("test_date") ?? "").trim();
  if (!testDate) {
    redirect("/profile?error=missing_test_date");
  }

  const individualNote = String(
    formData.get("individual_fatty_acids_note") ?? "",
  ).trim();
  const individualFattyAcids = individualNote ? { note: individualNote } : {};

  const supplementsRaw = String(formData.get("supplements_used") ?? "");
  const supplementsUsed = supplementsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const payload = {
    user_id: user.id,
    test_date: testDate,
    omega_3_total: numericOrNull(String(formData.get("omega_3_total") ?? "")),
    omega_6_total: numericOrNull(String(formData.get("omega_6_total") ?? "")),
    omega_ratio: numericOrNull(String(formData.get("omega_ratio") ?? "")),
    aa_epa_ratio: numericOrNull(String(formData.get("aa_epa_ratio") ?? "")),
    saturated_fat: numericOrNull(String(formData.get("saturated_fat") ?? "")),
    monounsaturated: numericOrNull(
      String(formData.get("monounsaturated") ?? ""),
    ),
    trans_fat: numericOrNull(String(formData.get("trans_fat") ?? "")),
    individual_fatty_acids: individualFattyAcids,
    cell_hardness: numericOrNull(String(formData.get("cell_hardness") ?? "")),
    mental_strength: numericOrNull(String(formData.get("mental_strength") ?? "")),
    supplements_used: supplementsUsed,
    notes: null,
  };

  const { data: latest, error: latestError } = await supabase
    .from("balance_tests")
    .select("id")
    .eq("user_id", user.id)
    .order("test_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    redirect(`/profile?error=${encodeURIComponent(latestError.message)}`);
  }

  if (latest?.id) {
    const { error } = await supabase
      .from("balance_tests")
      .update(payload)
      .eq("id", latest.id)
      .eq("user_id", user.id);

    if (error) {
      redirect(`/profile?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    const { error } = await supabase.from("balance_tests").insert(payload);
    if (error) {
      redirect(`/profile?error=${encodeURIComponent(error.message)}`);
    }
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      balance_test_choice: "entered",
      supplements_used: supplementsUsed,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    redirect(`/profile?error=${encodeURIComponent(profileError.message)}`);
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  redirect("/profile?saved=balance_test");
}
