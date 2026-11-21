"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
export function ThemeToggle() { const [light, setLight] = useState(false); useEffect(() => { const saved = localStorage.getItem("ssn-theme") === "light"; setLight(saved); document.body.classList.toggle("light", saved); }, []); function toggle() { const next = !light; setLight(next); document.body.classList.toggle("light", next); localStorage.setItem("ssn-theme", next ? "light" : "dark"); } return <button onClick={toggle} aria-label="Changer le thème" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-muted transition hover:border-primary hover:text-primary">{light ? <Moon size={18} /> : <Sun size={18} />}</button>; }
