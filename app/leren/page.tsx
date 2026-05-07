import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function LerenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  redirect("/kennisbank");
}
