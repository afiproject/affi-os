"use client";

import { useEffect, useRef, useState } from "react";

type Marker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color: string;
  icon?: string;
  photoUrl?: string;
  subLabel?: string;
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

    // Load Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Inject custom map styles for modern look
    const style = document.createElement("style");
    style.textContent = `
      .leaflet-container {
        background: #1a1a2e !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .leaflet-tile-pane {
        filter: saturate(0.7) brightness(0.85) contrast(1.1);
      }
      .leaflet-marker-custom {
        background: none !important;
        border: none !important;
      }
      .sloty-marker {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transition: transform 0.2s ease;
      }
      .sloty-marker:hover {
        transform: scale(1.15);
      }
      .sloty-marker-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 700;
        color: white;
        box-shadow: 0 2px 12px rgba(0,0,0,0.3), 0 0 0 3px rgba(255,255,255,0.9);
        position: relative;
        overflow: hidden;
      }
      .sloty-marker-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .sloty-marker-label {
        margin-top: 4px;
        background: rgba(0,0,0,0.75);
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        white-space: nowrap;
        backdrop-filter: blur(4px);
      }
      .sloty-marker-sub {
        background: rgba(0,0,0,0.6);
        color: rgba(255,255,255,0.8);
        padding: 1px 6px;
        border-radius: 8px;
        font-size: 9px;
        white-space: nowrap;
        margin-top: 2px;
      }
      .sloty-marker-ring {
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        animation: sloty-pulse 2s ease-in-out infinite;
      }
      @keyframes sloty-pulse {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 0.1; transform: scale(1.2); }
      }
      .sloty-poi-marker {
        width: 28px;
        height: 28px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        background: rgba(255,255,255,0.9);
        box-shadow: 0 1px 6px rgba(0,0,0,0.2);
        cursor: pointer;
        transition: transform 0.15s;
      }
      .sloty-poi-marker:hover {
        transform: scale(1.1);
      }
      .leaflet-control-attribution { display: none !important; }
    `;
    document.head.appendChild(style);

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(center, zoom);

      // Modern map tile layer (CartoDB Voyager for a clean modern look)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      // Radius circle with modern styling
      if (radiusCircle) {
        L.circle([radiusCircle.lat, radiusCircle.lng], {
          radius: radiusCircle.radius,
          color: "#7B8CFF",
          fillColor: "#7B8CFF",
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: "6 4",
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

      markers.forEach((m) => {
        const jitterLat = (Math.random() - 0.5) * 0.0008;
        const jitterLng = (Math.random() - 0.5) * 0.0008;

        // Check if it's a POI marker (gray color = POI)
        const isPoi = m.color === "#6b7280";

        let html: string;
        if (isPoi) {
          html = `<div class="sloty-poi-marker">${m.icon ?? "📍"}</div>`;
        } else {
          const avatarContent = m.photoUrl
            ? `<img src="${m.photoUrl}" alt="" />`
            : `<span>${m.icon ?? m.label[0]}</span>`;
          html = `
            <div class="sloty-marker">
              <div class="sloty-marker-avatar" style="background:${m.color}">
                <div class="sloty-marker-ring" style="border: 2px solid ${m.color}"></div>
                ${avatarContent}
              </div>
              <div class="sloty-marker-label">${m.label}</div>
              ${m.subLabel ? `<div class="sloty-marker-sub">${m.subLabel}</div>` : ""}
            </div>`;
        }

        const icon = L.divIcon({
          className: "leaflet-marker-custom",
          html,
          iconSize: isPoi ? [28, 28] : [60, 70],
          iconAnchor: isPoi ? [14, 14] : [30, 35],
        });

        const marker = L.marker([m.lat + jitterLat, m.lng + jitterLng], { icon }).addTo(map);
        if (isPoi) {
          marker.bindTooltip(m.label, { direction: "top", offset: [0, -14], className: "sloty-tooltip" });
        }
        if (m.onClick) marker.on("click", m.onClick);
      });
    });
  }, [loaded, markers]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%", borderRadius: 16, overflow: "hidden" }}
    />
  );
}
