"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

const HOUSTON: [number, number] = [29.7604, -95.3698];
const RADIUS_MILES = 34;
const RADIUS_METERS = RADIUS_MILES * 1609.34;

const places: { name: string; latlng: [number, number] }[] = [
  { name: "Houston", latlng: HOUSTON },
  { name: "Katy", latlng: [29.7858, -95.8245] },
  { name: "Tomball", latlng: [30.0972, -95.6161] },
  { name: "Rosharon", latlng: [29.3519, -95.4613] },
];

export function ServiceAreaMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let map: import("leaflet").Map | undefined;
    let cancelled = false;

    import("leaflet").then((leaflet) => {
      if (cancelled || !el) return;
      const L = leaflet.default;
      map = L.map(el, {
        center: HOUSTON,
        zoom: 9,
        minZoom: 8,
        maxZoom: 11,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
        },
      ).addTo(map);
      L.circle(HOUSTON, {
        radius: RADIUS_METERS,
        color: "#5aa8ff",
        weight: 2,
        fillColor: "#1d6fd8",
        fillOpacity: 0.22,
      }).addTo(map);
      for (const place of places) {
        L.circleMarker(place.latlng, {
          radius: 5,
          color: "#eef4ff",
          weight: 1,
          fillColor: "#5aa8ff",
          fillOpacity: 1,
        }).addTo(map);
        L.marker(place.latlng, {
          interactive: false,
          icon: L.divIcon({
            className: "service-map-label",
            html: `<span>${place.name}</span>`,
            iconSize: [0, 0],
            iconAnchor: [-8, 8],
          }),
        }).addTo(map);
      }
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-[28rem] w-full overflow-hidden border border-white/10"
    />
  );
}
