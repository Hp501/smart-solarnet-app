"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createLoad } from "@/app/dashboard/loads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loadSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  priority: z.enum(["critique", "important", "normal", "secondaire"]),
  rated_power_w: z.coerce.number().min(0).optional(),
  relay_channel: z.coerce.number().int().min(1).optional(),
});

type LoadFormValues = z.infer<typeof loadSchema>;

export function LoadForm({ siteId, onCreated }: { siteId: string; onCreated?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoadFormValues>({
    resolver: zodResolver(loadSchema),
    defaultValues: { priority: "normal" },
  });

  function onSubmit(values: LoadFormValues) {
    startTransition(async () => {
      const result = await createLoad({
        site_id: siteId,
        name: values.name,
        priority: values.priority,
        rated_power_w: values.rated_power_w ?? null,
        relay_channel: values.relay_channel ?? null,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Charge créée");
        reset();
        setIsOpen(false);
        onCreated?.();
      }
    });
  }

  if (!isOpen) {
    return (
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        + Ajouter une charge
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nom de la charge</Label>
          <Input id="name" placeholder="Réfrigérateur" {...register("name")} />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="priority">Priorité</Label>
          <select
            id="priority"
            {...register("priority")}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white"
          >
            <option value="critique">Critique</option>
            <option value="important">Important</option>
            <option value="normal">Normal</option>
            <option value="secondaire">Secondaire</option>
          </select>
        </div>

        <div>
          <Label htmlFor="rated_power_w">Puissance nominale (W)</Label>
          <Input id="rated_power_w" type="number" placeholder="150" {...register("rated_power_w")} />
        </div>

        <div>
          <Label htmlFor="relay_channel">Canal relais (ESP32, optionnel)</Label>
          <Input id="relay_channel" type="number" placeholder="1" {...register("relay_channel")} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" isLoading={isPending}>
          Créer la charge
        </Button>
        <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
