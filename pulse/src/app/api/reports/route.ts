import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

// POST /api/reports - Create a new report
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { spot_id, crowdedness, atmosphere, gender_ratio, comment } = body

  if (!spot_id || !crowdedness || !atmosphere || !gender_ratio) {
    return NextResponse.json(
      { error: 'spot_id, crowdedness, atmosphere, gender_ratio are required' },
      { status: 400 }
    )
  }

  // Validate enum values
  const validCrowdedness = ['empty', 'normal', 'crowded']
  const validAtmosphere = ['quiet', 'normal', 'lively']
  const validGenderRatio = ['male_heavy', 'balanced', 'female_heavy']

  if (!validCrowdedness.includes(crowdedness) || !validAtmosphere.includes(atmosphere) || !validGenderRatio.includes(gender_ratio)) {
    return NextResponse.json({ error: 'Invalid enum values' }, { status: 400 })
  }

  const { data, error } = await getSupabase()
    .from('reports')
    .insert({
      spot_id,
      crowdedness,
      atmosphere,
      gender_ratio,
      comment: comment || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
