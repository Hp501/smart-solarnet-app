"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createClient();

    // Retry silencieux une fois en cas d'erreur réseau transitoire,
    // avant d'afficher un message à l'utilisateur.
    let attempt = 0;
    let lastError: string | null = null;

    while (attempt < 2) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!signInError) {
        setIsLoading(false);
        router.push(redirectTo);
        router.refresh();
        return;
      }

      lastError = signInError.message;
      if (!signInError.message.toLowerCase().includes("network")) break;
      attempt++;
    }

    setIsLoading(false);
    setError(translateAuthError(lastError ?? "unknown"));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface p-6">
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mot de passe</Label>
          <a href="/reset-password" className="mb-1.5 text-xs text-primary hover:underline">
            Mot de passe oublié ?
          </a>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full">
        Se connecter
      </Button>

      <p className="text-center text-sm text-muted">
        Pas encore de compte ?{" "}
        <a href="/signup" className="text-primary hover:underline">
          S&apos;inscrire
        </a>
      </p>
    </form>
  );
}
