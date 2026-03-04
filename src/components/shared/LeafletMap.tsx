"use client";

import { useEffect, useRef, useState } from "react";

type Marker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color: string;
  icon?: string;
  onClick?: () => void;
};

type Props = {
  center: [number, number];
  zoom?: number;
  markers: Marker[];
  height?: number;
  radiusCircle?: { lat: number; lng: number; radius: number };
};

export default function LeafletMap({ center, zoom = 15, markers, height = 300, radiusCircle }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamically load Leaflet CSS + JS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(center, zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Add radius circle if specified
      if (radiusCircle) {
        L.circle([radiusCircle.lat, radiusCircle.lng], {
          radius: radiusCircle.radius,
          color: "#9b8afb",
          fillColor: "#9b8afb",
          fillOpacity: 0.1,
          weight: 1,
        }).addTo(map);
      }

      mapRef.current = map;
      setLoaded(true);
    });

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loaded || !mapRef.current) return;

    import("leaflet").then((L: any) => {
      const map = mapRef.current as any;

      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
      });

      // Add markers with jitter for privacy
      markers.forEach((m) => {
        const jitterLat = (Math.random() - 0.5) * 0.001;
        const jitterLng = (Math.random() - 0.5) * 0.001;

        const icon = L.divIcon({
          className: "leaflet-marker-custom",
          html: `<div style="
            background: ${m.color};
            width: 32px; height: 32px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            cursor: pointer;
          ">${m.icon ?? m.label[0]}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([m.lat + jitterLat, m.lng + jitterLng], { icon }).addTo(map);
        marker.bindTooltip(m.label, { direction: "top", offset: [0, -16] });
        if (m.onClick) marker.on("click", m.onClick);
      });
    });
  }, [loaded, markers]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%", borderRadius: 12, overflow: "hidden" }}
    />
  );
}
