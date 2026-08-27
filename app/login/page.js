"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Feather, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!email.trim() || !password) {
      setError("Renseigne un email et un mot de passe.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError(
            signInError.message === "Invalid login credentials"
              ? "Email ou mot de passe incorrect."
              : signInError.message
          );
          return;
        }
        router.push("/dashboard");
        router.refresh();
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        setInfo("Compte créé. Vérifie ta boîte mail pour confirmer l'adresse, puis connecte-toi.");
        setMode("signin");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-1">
          <Feather size={26} strokeWidth={1.5} className="text-brass" />
          <h1 className="font-display text-3xl font-semibold">Le Plumier</h1>
        </div>
        <p className="text-center text-sm text-paperDark2 font-mono mb-8">
          Catalogue de stylos — accès privé
        </p>

        <div className="flex mb-6 rounded-lg overflow-hidden border border-paperDark3">
          <button
            className={`flex-1 py-2 text-sm ${mode === "signin" ? "bg-teal" : "bg-transparent text-paperDark2"}`}
            onClick={() => setMode("signin")}
          >
            Se connecter
          </button>
          <button
            className={`flex-1 py-2 text-sm ${mode === "signup" ? "bg-teal" : "bg-transparent text-paperDark2"}`}
            onClick={() => setMode("signup")}
          >
            Créer un compte
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-paperDark2">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-navyDeep border border-paperDark3 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass"
              placeholder="toi@example.com"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-paperDark2">Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-navyDeep border border-paperDark3 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass"
              placeholder="••••••••"
            />
          </label>

          {error && <p className="text-sm text-rust">{error}</p>}
          {info && <p className="text-sm text-brass">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 bg-teal hover:bg-tealDark rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {mode === "signin" ? "Se connecter" : "Créer le compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
