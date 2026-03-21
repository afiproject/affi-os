import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

// GET /api/spots?north=...&south=...&east=...&west=...
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const north = parseFloat(searchParams.get('north') || '90')
  const south = parseFloat(searchParams.get('south') || '-90')
  const east = parseFloat(searchParams.get('east') || '180')
  const west = parseFloat(searchParams.get('west') || '-180')

  // Get spots within bounds
  const { data: spots, error: spotsError } = await getSupabase()
    .from('spots')
    .select('*')
    .gte('latitude', south)
    .lte('latitude', north)
    .gte('longitude', west)
    .lte('longitude', east)
    .limit(100)

  if (spotsError) {
    return NextResponse.json({ error: spotsError.message }, { status: 500 })
  }

  if (!spots || spots.length === 0) {
    return NextResponse.json([])
  }

  // Get active reports for these spots (not expired)
  const spotIds = spots.map((s) => s.id)
  const { data: reports, error: reportsError } = await getSupabase()
    .from('reports')
    .select('*')
    .in('spot_id', spotIds)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (reportsError) {
    return NextResponse.json({ error: reportsError.message }, { status: 500 })
  }

  // Combine spots with their reports
  const spotsWithReports = spots.map((spot) => {
    const spotReports = (reports || []).filter((r) => r.spot_id === spot.id)
    return {
      ...spot,
      reports: spotReports,
      latest_report: spotReports[0] || null,
      report_count: spotReports.length,
    }
  })

  return NextResponse.json(spotsWithReports)
}

// POST /api/spots - Create a new spot
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, category, latitude, longitude } = body

  if (!name || !latitude || !longitude) {
    return NextResponse.json({ error: 'name, latitude, longitude are required' }, { status: 400 })
  }

  const { data, error } = await getSupabase()
    .from('spots')
    .insert({ name, category: category || 'other', latitude, longitude })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
