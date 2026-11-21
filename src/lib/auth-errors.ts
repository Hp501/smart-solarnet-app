/**
 * Traduit les codes d'erreur Supabase Auth en messages clairs, en français,
 * pour ne jamais laisser un utilisateur bloqué avec une erreur technique.
 */
export function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "Un compte existe déjà avec cet email. Essayez de vous connecter.";
  }
  if (normalized.includes("password") && normalized.includes("6")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Veuillez confirmer votre email avant de vous connecter (vérifiez votre boîte de réception).";
  }
  if (normalized.includes("rate limit")) {
    return "Trop de tentatives. Veuillez réessayer dans quelques minutes.";
  }
  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "Problème de connexion. Vérifiez votre connexion internet et réessayez.";
  }
  if (normalized.includes("invalid email")) {
    return "L'adresse email saisie n'est pas valide.";
  }

  return "Une erreur est survenue. Veuillez réessayer.";
}
