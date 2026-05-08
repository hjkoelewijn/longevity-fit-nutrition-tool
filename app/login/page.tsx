"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      const next = params.get("next") ?? "/dashboard";
      const forward = new URL("/auth/confirm", window.location.origin);
      forward.searchParams.set("code", code);
      forward.searchParams.set("next", next);
      window.location.replace(forward.toString());
      return;
    }

    const error = params.get("error");
    const reason = params.get("reason");
    if (error && reason) {
      setStatus("error");
      setMessage(`Inloggen is niet gelukt (${reason}).`);
    }
  }, []);

  function getNormalizedEmail() {
    const fromState = email.trim().toLowerCase();
    if (fromState) return fromState;
    const fromDom =
      typeof document !== "undefined"
        ? (document.getElementById("email") as HTMLInputElement | null)?.value?.trim().toLowerCase()
        : "";
    return fromDom || "";
  }

  function getRedirectBaseUrl() {
    const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (configured) {
      return configured.replace(/\/+$/, "");
    }
    if (window.location.hostname.endsWith(".vercel.app")) {
      return "https://app.longevityfit.nl";
    }
    return window.location.origin;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const redirectTo = `${getRedirectBaseUrl()}/auth/confirm?next=/dashboard`;
    const normalizedEmail = getNormalizedEmail();
    if (!normalizedEmail) {
      setStatus("error");
      setMessage("Vul eerst je e-mailadres in.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: false,
      },
    });

    if (error) {
      setStatus("error");
      if (/signups?\s+not\s+allowed|user not found/i.test(error.message)) {
        setMessage(
          "We vinden nog geen account met dit e-mailadres. Gebruik inloggen met wachtwoord of laat je account eerst klaarzetten.",
        );
      } else {
        setMessage(error.message);
      }
      return;
    }

    setStatus("success");
    setMessage("Check je e-mail. We hebben je een veilige inloglink gestuurd.");
  }

  async function handleFirstTimeLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const redirectTo = `${getRedirectBaseUrl()}/auth/confirm?next=/auth/set-password&first_time=1`;
    const normalizedEmail = getNormalizedEmail();
    if (!normalizedEmail) {
      setStatus("error");
      setMessage("Vul eerst je e-mailadres in.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage(
      "Check je e-mail. We hebben je een activatielink gestuurd. Na je eerste login kun je een wachtwoord instellen.",
    );
  }

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const normalizedEmail = getNormalizedEmail();
    if (!normalizedEmail) {
      setStatus("error");
      setMessage("Vul eerst je e-mailadres in.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
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
          <p className="-mt-2 text-xs text-stone-500">
            Alleen invullen als je al een wachtwoord hebt.
          </p>
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
            Eerste keer inloggen?
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Stap 1: vul hierboven alleen je e-mailadres in. Stap 2: klik op activatielink. Pas
            daarna log je in met wachtwoord.
          </p>
          <form onSubmit={handleFirstTimeLink} className="mt-4 space-y-4">
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "loading" ? "Versturen..." : "Stuur activatielink"}
            </button>
          </form>
        </div>

        <div className="mt-6 border-t border-stone-200 pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Geen wachtwoord bij de hand?
          </p>
          <p className="mt-2 text-sm text-stone-600">Gebruik dan een eenmalige inloglink via e-mail.</p>

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
