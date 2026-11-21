"use client";

import { useState, useTransition } from "react";
import { toggleLoad } from "@/app/dashboard/loads/actions";
import { toast } from "sonner";

export function LoadToggle({ loadId, initialState }: { loadId: string; initialState: boolean }) {
  const [isOn, setIsOn] = useState(initialState);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const newState = !isOn;
    setIsOn(newState); // optimiste

    startTransition(async () => {
      const result = await toggleLoad(loadId, newState);
      if (result.error) {
        setIsOn(!newState); // rollback
        toast.error(result.error);
      } else {
        toast.success(newState ? "Charge activée" : "Charge désactivée");
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      role="switch"
      aria-checked={isOn}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        isOn ? "bg-energy" : "bg-white/10"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          isOn ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
