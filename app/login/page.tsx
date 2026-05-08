"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/confirm?next=/dashboard`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage("Check je e-mail. We hebben je een veilige inloglink gestuurd.");
  }

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    window.location.href = "/dashboard";
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
        <h1 className="mt-6 text-3xl font-semibold text-stone-900">Inloggen</h1>
        <p className="mt-2 text-sm text-stone-600">
          Log in met je e-mailadres en wachtwoord. Op dit apparaat blijf je daarna gewoon
          ingelogd.
        </p>

        <form onSubmit={handlePasswordLogin} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-stone-700" htmlFor="email">
            E-mailadres
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="jij@voorbeeld.nl"
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          />

          <label className="block text-sm font-medium text-stone-700" htmlFor="password">
            Wachtwoord
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          />

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "loading" ? "Inloggen..." : "Inloggen"}
          </button>
        </form>

        <div className="mt-6 border-t border-stone-200 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Geen wachtwoord bij de hand?
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Gebruik dan een eenmalige inloglink via e-mail.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Versturen..." : "Stuur inloglink"}
            </button>
          </form>
        </div>

        {message ? (
          <p
            className={`mt-4 text-sm ${
              status === "error" ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}
