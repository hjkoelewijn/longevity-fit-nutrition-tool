import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signOutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const welkom = searchParams.welkom === "1" || searchParams.welkom === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  const firstName =
    typeof profile?.name === "string" && profile.name.trim()
      ? profile.name.trim().split(/\s+/)[0]
      : null;

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-stone-200 bg-white p-10 shadow-sm">
        <div className="flex justify-start">
          <Image
            src="/branding/longevity-fit-zwart-goud.png"
            alt="Longevity Fit"
            width={300}
            height={35}
            priority
          />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-stone-900">Dashboard</h1>

        {welkom ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-950">
            <p className="font-medium">
              Welkom{firstName ? `, ${firstName}` : ""}. We hebben je profiel klaar.
            </p>
            <p className="mt-2 text-emerald-900/90">
              Je kunt nu je eerste weekplan genereren op basis van je profiel.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-stone-600">
            Welkom{user.email ? `, ${user.email}` : ""}. Je bent succesvol ingelogd.
          </p>
        )}

        <div className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-6">
          <p className="text-sm text-stone-700">
            Receptenbibliotheek en leermodules zijn beschikbaar. Je persoonlijke weekplan en
            boodschappenlijst vind je onder Weekplan.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
          <Link
            href="/weekplan"
            className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
          >
            Weekplan
          </Link>
          <Link
            href="/recipes"
            className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
          >
            Recepten
          </Link>
          <Link
            href="/inspiratie"
            className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
          >
            Inspiratie
          </Link>
          <Link
            href="/leren"
            className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
          >
            Leren
          </Link>
          <Link
            href="/profile"
            className="text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
          >
            Profiel
          </Link>
        </div>

        <form action={signOutAction} className="mt-8">
          <button
            type="submit"
            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
          >
            Uitloggen
          </button>
        </form>
      </div>
    </main>
  );
}
