'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { DEFAULT_CENTER, DEFAULT_ZOOM, CROWDEDNESS_LABELS } from '@/lib/constants'
import type { SpotWithReports } from '@/types/database'

interface MapProps {
  spots: SpotWithReports[]
  onSpotClick: (spot: SpotWithReports) => void
  onMapClick: (lngLat: { lng: number; lat: number }) => void
  onBoundsChange: (bounds: { north: number; south: number; east: number; west: number }) => void
}

export default function Map({ spots, onSpotClick, onMapClick, onBoundsChange }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  const notifyBounds = useCallback(() => {
    if (!map.current) return
    const bounds = map.current.getBounds()
    if (!bounds) return
    onBoundsChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    })
  }, [onBoundsChange])

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      console.error('Mapbox token not set')
      return
    }
    mapboxgl.accessToken = token

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: userLocation || DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    })

    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'bottom-right'
    )

    map.current.on('moveend', notifyBounds)

    map.current.on('click', (e) => {
      // Only trigger if clicking on the map itself (not a marker)
      const target = e.originalEvent.target as HTMLElement
      if (target.closest('.pulse-marker')) return
      onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat })
    })

    map.current.on('load', notifyBounds)

    // Try to get user location
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.longitude, pos.coords.latitude]
        setUserLocation(loc)
        map.current?.flyTo({ center: loc, zoom: DEFAULT_ZOOM })
      },
      () => {
        // Use default center (Tokyo)
      }
    )

    return () => {
      map.current?.remove()
      map.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers when spots change
  useEffect(() => {
    if (!map.current) return

    // Remove old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    spots.forEach((spot) => {
      const latestReport = spot.latest_report
      const crowdInfo = latestReport
        ? CROWDEDNESS_LABELS[latestReport.crowdedness]
        : null

      const el = document.createElement('div')
      el.className = 'pulse-marker'
      el.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
        ">
          <div style="
            background: ${crowdInfo ? crowdInfo.color : '#6b7280'};
            color: white;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span>${crowdInfo ? crowdInfo.emoji : '📍'}</span>
            <span>${spot.name.length > 8 ? spot.name.slice(0, 8) + '…' : spot.name}</span>
            ${spot.report_count > 0 ? `<span style="opacity:0.7;font-size:10px">${spot.report_count}</span>` : ''}
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid ${crowdInfo ? crowdInfo.color : '#6b7280'};
          "></div>
        </div>
      `

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onSpotClick(spot)
      })

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([spot.longitude, spot.latitude])
        .addTo(map.current!)

      markersRef.current.push(marker)
    })
  }, [spots, onSpotClick])

  return (
    <div ref={mapContainer} className="w-full h-full" />
  )
}
