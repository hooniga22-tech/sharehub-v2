/**
 * Rotate all portal access tokens to crypto-secure 64-char hex strings.
 * Usage: npx tsx scripts/rotate-portal-tokens.ts
 */
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const supabase = createClient(url, key)

async function rotateTokens(table: string, prefix: string) {
  const { data: rows, error } = await supabase.from(table).select('id, access_token')
  if (error) {
    console.error(`Error reading ${table}:`, error.message)
    return 0
  }
  if (!rows || rows.length === 0) {
    console.log(`  ${table}: 0 rows`)
    return 0
  }

  let updated = 0
  for (const row of rows) {
    const newToken = prefix + '_' + randomBytes(32).toString('hex')
    const { error: updateErr } = await supabase
      .from(table)
      .update({ access_token: newToken })
      .eq('id', row.id)

    if (updateErr) {
      console.error(`  Failed to update ${table} id=${row.id}:`, updateErr.message)
    } else {
      updated++
    }
  }
  console.log(`  ${table}: ${updated}/${rows.length} tokens rotated`)
  return updated
}

async function main() {
  console.log('Portal token rotation started...\n')

  const investors = await rotateTokens('investors', 'i')
  const workers = await rotateTokens('workers', 'w')
  const tenants = await rotateTokens('tenants', 't')

  const total = investors + workers + tenants
  console.log(`\nDone. Total tokens rotated: ${total}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
