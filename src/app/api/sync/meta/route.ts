import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { format, subDays } from 'date-fns'

const WINDSOR_KEY = process.env.WINDSOR_API_KEY!
const WINDSOR_BASE = process.env.WINDSOR_BASE_URL ?? 'https://connectors.windsor.ai'

const META_ACCOUNTS = [
  '1735113139989857','403663420100973','961650757625796','1847386985347986',
  '777050266134172','992386864471766','905420285681589','469315270785940',
  '1184002296160825','1239913009988989','1100672934584550','886558279232108',
  '790761380532137','2659430351062582','503453318661318','889198435432397',
  '430096303398103','1459616038851486','925662795239797',
]

export async function POST(req: NextRequest) {
  // Use service role client directly (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await req.json().catch(() => ({}))
  const days = body.days ?? 30
  const dateFrom = format(subDays(new Date(), days - 1), 'yyyy-MM-dd')
  const dateTo = format(new Date(), 'yyyy-MM-dd')

  const fields = [
    'account_id','date','spend','impressions','reach','clicks','link_clicks',
    'actions_lead','actions_offsite_conversion_fb_pixel_purchase',
    'action_values_offsite_conversion_fb_pixel_purchase',
    'frequency','cpm','cpc','ctr',
  ].join(',')

  const results = { inserted: 0, errors: [] as string[], debug: [] as string[] }

  // Fetch in batches of 4 accounts
  const batchSize = 4
  for (let i = 0; i < META_ACCOUNTS.length; i += batchSize) {
    const batch = META_ACCOUNTS.slice(i, i + batchSize)

    const params = new URLSearchParams({
      api_key: WINDSOR_KEY,
      date_from: dateFrom,
      date_to: dateTo,
      fields,
      account_id: batch.join(','),
    })
    const url = `${WINDSOR_BASE}/facebook?${params.toString()}`

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
          reach: Number(row.reach ?? 0),
          clicks: Number(row.clicks ?? 0),
          link_clicks: Number(row.link_clicks ?? 0),
          leads: Number(row.actions_lead ?? 0),
          conversions: Number(row.actions_offsite_conversion_fb_pixel_purchase ?? 0),
          conversion_value: Number(row.action_values_offsite_conversion_fb_pixel_purchase ?? 0),
          cpm: Number(row.cpm ?? 0),
          cpc: Number(row.cpc ?? 0),
          ctr: Number(row.ctr ?? 0),
          frequency: Number(row.frequency ?? 0),
          synced_at: new Date().toISOString(),
        }

        const { error } = await supabase
          .from('meta_account_daily')
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
