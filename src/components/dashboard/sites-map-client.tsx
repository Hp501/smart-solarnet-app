"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { SiteRow } from "@/types/database.types";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const faultIcon = L.divIcon({
  className: "",
  html: '<span style="display:block;width:20px;height:20px;border-radius:9999px;background:#ef4444;border:3px solid white;box-shadow:0 1px 5px rgba(0,0,0,.45)"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export function SitesMapClient({ sites, faultSiteIds = [] }: { sites: SiteRow[]; faultSiteIds?: string[] }) {
  const geoSites = sites.filter((site) => site.latitude != null && site.longitude != null);

  if (geoSites.length === 0) {
    return <div className="flex h-[420px] items-center justify-center rounded-xl border border-border text-sm text-muted">Aucun site geolocalise pour l&apos;instant.</div>;
  }

  const center: [number, number] = [geoSites[0].latitude!, geoSites[0].longitude!];

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <MapContainer center={center} zoom={6} style={{ height: 420, width: "100%" }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {geoSites.map((site) => {
          const hasFault = faultSiteIds.includes(site.id);
          return (
            <Marker key={site.id} position={[site.latitude!, site.longitude!]} icon={hasFault ? faultIcon : defaultIcon}>
              <Popup>
                <strong>{site.name}</strong><br />
                {site.city} - {site.installed_capacity_kw ?? "-"} kW
                {hasFault && <><br /><strong style={{ color: "#dc2626" }}>Panne ou alerte en cours</strong></>}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
