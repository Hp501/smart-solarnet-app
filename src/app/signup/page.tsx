import { SignupForm } from "@/components/auth/signup-form";
import { AuthShell } from "@/components/auth/auth-shell";
export const metadata = { title: "Créer un compte — Smart SolarNet" };
export default function SignupPage() { return <AuthShell><SignupForm /></AuthShell>; }
