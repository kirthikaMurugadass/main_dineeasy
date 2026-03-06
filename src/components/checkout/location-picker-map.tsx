"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type LatLng = { lat: number; lng: number };

const DEFAULT_CENTER: LatLng = { lat: 47.3769, lng: 8.5417 }; // Zurich (neutral default)

export function LocationPickerMap({
  value,
  onChange,
  readOnly = false,
  className,
}: {
  value: LatLng | null;
  onChange: (next: LatLng) => void;
  readOnly?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    async function init() {
      if (!containerRef.current) return;
      if (mapRef.current) return;

      const L: any = await import("leaflet");
      if (isCancelled) return;

      // Fix marker icons for bundlers
      const DefaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      const map = L.map(containerRef.current, {
        zoomControl: true,
      });
      mapRef.current = map;

      const initialCenter = value ?? DEFAULT_CENTER;
      map.setView([initialCenter.lat, initialCenter.lng], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      if (value) {
        markerRef.current = L.marker([value.lat, value.lng], {
          icon: DefaultIcon,
        }).addTo(map);
      }

      if (!readOnly) {
        map.on("click", (e: any) => {
          const next: LatLng = { lat: e.latlng.lat, lng: e.latlng.lng };
          onChange(next);

          if (markerRef.current) {
            markerRef.current.setLatLng([next.lat, next.lng]);
          } else {
            markerRef.current = L.marker([next.lat, next.lng], {
              icon: DefaultIcon,
            }).addTo(map);
          }
        });
      }

      // Try centering on user's location for nicer UX (non-blocking)
      if (typeof navigator !== "undefined" && navigator.geolocation && !value) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!mapRef.current) return;
            const next: LatLng = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            mapRef.current.setView([next.lat, next.lng], 14);
          },
          () => {},
          { enableHighAccuracy: false, timeout: 3000 }
        );
      }
    }

    init();

    return () => {
      isCancelled = true;
      // Leaflet cleanup
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep marker in sync if value changes programmatically
  useEffect(() => {
    async function syncMarker() {
      if (!mapRef.current) return;
      if (!value) return;
      const L: any = await import("leaflet");

      const nextLatLng = [value.lat, value.lng];
      if (markerRef.current) {
        markerRef.current.setLatLng(nextLatLng);
      } else {
        markerRef.current = L.marker(nextLatLng).addTo(mapRef.current);
      }
    }

    syncMarker();
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-56 w-full overflow-hidden rounded-2xl border border-border/60 bg-muted/30 shadow-sm",
        className
      )}
    />
  );
}

