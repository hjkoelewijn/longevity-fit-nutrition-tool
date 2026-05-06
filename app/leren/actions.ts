"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function markModuleCompleteAction(formData: FormData) {
  const moduleId = String(formData.get("module_id") ?? "").trim();
  if (!moduleId) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { error } = await supabase.from("module_completions").insert({
    user_id: user.id,
    module_id: moduleId,
  });

  if (error && error.code !== "23505") {
    return;
  }

  revalidatePath("/leren", "layout");
}
