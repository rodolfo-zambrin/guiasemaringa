import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { format, subDays } from 'date-fns'

const WINDSOR_KEY = process.env.WINDSOR_API_KEY!
const WINDSOR_BASE = process.env.WINDSOR_BASE_URL ?? 'https://connectors.windsor.ai'

const GOOGLE_ACCOUNTS = [
  '842-650-4432','146-404-8039','611-909-3219','142-560-0294','929-008-1178',
  '636-999-8968','929-073-4541','984-710-1992','602-449-0797','397-266-0827','568-925-7999',
]

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await req.json().catch(() => ({}))
  const days = body.days ?? 30
  const dateFrom = format(subDays(new Date(), days - 1), 'yyyy-MM-dd')
  const dateTo = format(new Date(), 'yyyy-MM-dd')

  const fields = [
    'account_id','date','spend','impressions','clicks',
    'conversions','conversion_value','ctr','avg_cpc',
  ].join(',')

  const results = { inserted: 0, errors: [] as string[], debug: [] as string[] }

  const batchSize = 3
  for (let i = 0; i < GOOGLE_ACCOUNTS.length; i += batchSize) {
    const batch = GOOGLE_ACCOUNTS.slice(i, i + batchSize)

    const params = new URLSearchParams({
      api_key: WINDSOR_KEY,
      date_from: dateFrom,
      date_to: dateTo,
      fields,
      account_id: batch.join(','),
    })
    const url = `${WINDSOR_BASE}/google_ads?${params.toString()}`

    try {
      const res = await fetch(url, { cache: 'no-store' })
      const text = await res.text()

      if (!res.ok) {
        results.errors.push(`Batch ${i}: HTTP ${res.status} — ${text.slice(0, 200)}`)
        continue
      }

      let json: { data?: Record<string, unknown>[] }
      try {
        json = JSON.parse(text)
      } catch {
        results.errors.push(`Batch ${i}: JSON parse error — ${text.slice(0, 200)}`)
        continue
      }

      const rows = json?.data ?? []
      results.debug.push(`Batch ${i}: ${rows.length} rows from Windsor`)

      for (const row of rows) {
        if (!row.account_id || !row.date) continue

        const record = {
          account_id: String(row.account_id),
          date: String(row.date),
          spend: Number(row.spend ?? 0),
          impressions: Number(row.impressions ?? 0),
          clicks: Number(row.clicks ?? 0),
          conversions: Number(row.conversions ?? 0),
          conversion_value: Number(row.conversion_value ?? 0),
          ctr: Number(row.ctr ?? 0),
          avg_cpc: Number(row.avg_cpc ?? 0),
          synced_at: new Date().toISOString(),
        }

        const { error } = await supabase
          .from('google_account_daily')
          .upsert(record, { onConflict: 'account_id,date' })

        if (error) {
          results.errors.push(`Upsert ${record.account_id}/${record.date}: ${error.message}`)
        } else {
          results.inserted++
        }
      }
    } catch (e: unknown) {
      results.errors.push(`Batch ${i} exception: ${String(e)}`)
    }
  }

  return NextResponse.json({ ok: true, dateFrom, dateTo, ...results })
}
