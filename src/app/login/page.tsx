import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
export const metadata = { title: "Connexion — Smart SolarNet" };
export default function LoginPage() { return <AuthShell><Suspense fallback={null}><LoginForm /></Suspense></AuthShell>; }
