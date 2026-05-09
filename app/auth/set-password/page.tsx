"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.replace("/login");
      }
    }
    void checkSession();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    if (password.length < 8) {
      setStatus("error");
      setMessage("Kies een wachtwoord van minimaal 8 tekens.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("De wachtwoorden komen niet overeen.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage("Je wachtwoord is ingesteld. Je wordt doorgestuurd...");
    window.setTimeout(() => {
      window.location.replace("/dashboard");
    }, 800);
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-16">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex justify-center">
          <Image
            src="/branding/longevity-fit-zwart-goud.png"
            alt="Longevity Fit"
            width={260}
            height={30}
            priority
          />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-stone-900">Kies je wachtwoord</h1>
        <p className="mt-2 text-sm text-stone-600">
          Je bent ingelogd via de link uit je mail. Stel hier een wachtwoord in om voortaan met
          e-mail + wachtwoord in te loggen. Heb je al een wachtwoord of wil je dit overslaan? Ga
          direct naar de app.
        </p>

        <p className="mt-4 text-center text-sm">
          <Link
            href="/dashboard"
            className="font-medium text-stone-700 underline decoration-stone-300 underline-offset-4 hover:text-stone-900"
          >
            Doorgaan naar de app zonder wachtwoord te wijzigen
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-stone-700" htmlFor="password">
            Nieuw wachtwoord
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimaal 8 tekens"
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          />

          <label className="block text-sm font-medium text-stone-700" htmlFor="confirm-password">
            Herhaal wachtwoord
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Herhaal je wachtwoord"
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          />

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "loading" ? "Opslaan..." : "Wachtwoord opslaan"}
          </button>
        </form>

        {message ? (
          <p className={`mt-4 text-sm ${status === "error" ? "text-red-600" : "text-emerald-700"}`}>
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}

