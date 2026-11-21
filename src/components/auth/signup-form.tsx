"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Formulaire d'inscription.
 *
 * Fiabilité de l'enregistrement : dès que `signUp()` réussit, la ligne
 * correspondante dans `public.users` existe déjà — elle est créée par le
 * trigger PostgreSQL `handle_new_user()` (voir supabase/migrations/0010),
 * pas par ce composant. Aucun appel réseau supplémentaire n'est donc
 * nécessaire ici pour "enregistrer le profil" : si `signUp` répond sans
 * erreur, le profil est garanti présent en base.
 */
export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function validate(): string | null {
    if (fullName.trim().length < 2) return "Veuillez indiquer votre nom complet.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Adresse email invalide.";
    if (password.length < 6) return "Le mot de passe doit contenir au moins 6 caractères.";
    if (password !== confirmPassword) return "Les mots de passe ne correspondent pas.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    const supabase = createClient();

    // Un seul appel réseau : signUp(). Le rôle "client" est forcé côté
    // trigger PostgreSQL — jamais lu depuis un champ modifiable du formulaire.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          language: "fr",
        },
      },
    });

    setIsLoading(false);

    if (signUpError) {
      setError(translateAuthError(signUpError.message));
      return;
    }

    // Si la confirmation email est activée dans Supabase Auth, `session`
    // est null ici : on affiche l'écran "vérifiez votre boîte mail".
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="mb-1 text-lg font-medium text-white">Vérifiez votre boîte mail 📩</p>
        <p className="text-sm text-muted">
          Un email de confirmation a été envoyé à <span className="text-white">{email}</span>.
          Cliquez sur le lien pour activer votre compte.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-surface p-6">
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="fullName">Nom complet</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jean Mballa"
          autoComplete="name"
          required
        />
      </div>

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
        <Label htmlFor="phone">Téléphone (optionnel)</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+237 6XX XXX XXX"
          autoComplete="tel"
        />
      </div>

      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          required
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          required
        />
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full">
        Créer mon compte
      </Button>

      <p className="text-center text-sm text-muted">
        Déjà inscrit ?{" "}
        <a href="/login" className="text-primary hover:underline">
          Se connecter
        </a>
      </p>
    </form>
  );
}
