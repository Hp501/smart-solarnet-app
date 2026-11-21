"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/app/dashboard/settings/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ProfileForm({
  defaultFullName,
  defaultPhone,
  email,
  defaultLanguage,
}: {
  defaultFullName: string;
  defaultPhone: string;
  email: string;
  defaultLanguage: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result?.error) toast.error(result.error);
      else toast.success("Profil mis à jour");
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Nom complet</Label>
        <Input id="fullName" name="fullName" defaultValue={defaultFullName} required />
      </div>
      <div>
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" name="phone" defaultValue={defaultPhone} />
      </div>
      <div>
        <Label>Email</Label>
        <Input value={email} disabled />
      </div>
      <div>
        <Label htmlFor="language">Langue</Label>
        <select
          id="language"
          name="language"
          defaultValue={defaultLanguage}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>
      <Button type="submit" isLoading={isPending}>
        Enregistrer
      </Button>
    </form>
  );
}
