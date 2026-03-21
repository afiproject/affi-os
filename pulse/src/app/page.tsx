'use client'

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import ReportModal from '@/components/ReportModal'
import SpotDetail from '@/components/SpotDetail'
import type { SpotWithReports, SpotCategory, Crowdedness, Atmosphere, GenderRatio } from '@/types/database'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

export default function Home() {
  const [spots, setSpots] = useState<SpotWithReports[]>([])
  const [selectedSpot, setSelectedSpot] = useState<SpotWithReports | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [newSpotLngLat, setNewSpotLngLat] = useState<{ lng: number; lat: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const boundsRef = useRef<{ north: number; south: number; east: number; west: number } | null>(null)

  const fetchSpots = useCallback(async (bounds: { north: number; south: number; east: number; west: number }) => {
    boundsRef.current = bounds
    try {
      const params = new URLSearchParams({
        north: bounds.north.toString(),
        south: bounds.south.toString(),
        east: bounds.east.toString(),
        west: bounds.west.toString(),
      })
      const res = await fetch(`/api/spots?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSpots(data)
      }
    } catch (err) {
      console.error('Failed to fetch spots:', err)
    }
  }, [])

  const handleSpotClick = useCallback((spot: SpotWithReports) => {
    setSelectedSpot(spot)
    setShowReportModal(false)
  }, [])

  const handleMapClick = useCallback((lngLat: { lng: number; lat: number }) => {
    setNewSpotLngLat(lngLat)
    setSelectedSpot(null)
    setShowReportModal(true)
  }, [])

  const handleReportForExisting = () => {
    setShowReportModal(true)
  }

  const handleSubmitReport = async (data: {
    spotName?: string
    category?: SpotCategory
    crowdedness: Crowdedness
    atmosphere: Atmosphere
    gender_ratio: GenderRatio
    comment: string
    lngLat?: { lng: number; lat: number }
  }) => {
    setIsSubmitting(true)
    try {
      let spotId = selectedSpot?.id

      // If new spot, create it first
      if (data.spotName && data.lngLat) {
        const spotRes = await fetch('/api/spots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.spotName,
            category: data.category || 'other',
            latitude: data.lngLat.lat,
            longitude: data.lngLat.lng,
          }),
        })
        if (!spotRes.ok) throw new Error('Failed to create spot')
        const newSpot = await spotRes.json()
        spotId = newSpot.id
      }

      if (!spotId) throw new Error('No spot ID')

      // Create report
      const reportRes = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spot_id: spotId,
          crowdedness: data.crowdedness,
          atmosphere: data.atmosphere,
          gender_ratio: data.gender_ratio,
          comment: data.comment || null,
        }),
      })
      if (!reportRes.ok) throw new Error('Failed to create report')

      // Refresh spots
      if (boundsRef.current) {
        await fetchSpots(boundsRef.current)
      }

      setShowReportModal(false)
      setSelectedSpot(null)
      setNewSpotLngLat(null)
    } catch (err) {
      console.error('Submit error:', err)
      alert('送信に失敗しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeAll = () => {
    setSelectedSpot(null)
    setShowReportModal(false)
    setNewSpotLngLat(null)
  }

  return (
    <main className="relative w-full h-dvh overflow-hidden bg-black">
      {/* Map */}
      <Map
        spots={spots}
        onSpotClick={handleSpotClick}
        onMapClick={handleMapClick}
        onBoundsChange={fetchSpots}
      />

      {/* Logo */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h1 className="text-2xl font-black tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            PULSE
          </span>
        </h1>
        <p className="text-[10px] text-white/40 -mt-0.5">今ここの空気がわかる</p>
      </div>

      {/* Tap hint */}
      {spots.length === 0 && !showReportModal && !selectedSpot && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-white/10 backdrop-blur-md text-white/70 text-sm px-5 py-2.5 rounded-full">
            マップをタップしてスポットを追加
          </div>
        </div>
      )}

      {/* Spot Detail Panel */}
      {selectedSpot && !showReportModal && (
        <SpotDetail
          spot={selectedSpot}
          onReport={handleReportForExisting}
          onClose={closeAll}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          spotName={selectedSpot?.name}
          isNewSpot={!selectedSpot}
          lngLat={newSpotLngLat || undefined}
          onSubmit={handleSubmitReport}
          onClose={closeAll}
          isSubmitting={isSubmitting}
        />
      )}
    </main>
  )
}
