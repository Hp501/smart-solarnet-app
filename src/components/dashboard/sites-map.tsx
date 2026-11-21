"use client";

import dynamic from "next/dynamic";
import type { SiteRow } from "@/types/database.types";

const SitesMapClient = dynamic(
  () => import("./sites-map-client").then((module) => module.SitesMapClient),
  {
    ssr: false,
    loading: () => <div className="h-[420px] animate-pulse rounded-xl bg-white/5" />,
  },
);

export function SitesMap({ sites, faultSiteIds = [] }: { sites: SiteRow[]; faultSiteIds?: string[] }) {
  return <SitesMapClient sites={sites} faultSiteIds={faultSiteIds} />;
}
