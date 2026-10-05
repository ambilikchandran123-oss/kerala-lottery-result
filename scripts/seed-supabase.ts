import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Polyfill WebSocket for Node < 22
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class MockWebSocket {};
}

// Load environment variables from .env.local if present
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('your-supabase-project')) {
  console.error('❌ Supabase credentials missing!');
  console.error('Please make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function seed() {
  console.log('🚀 Starting Supabase Database Migration & Data Sync...');

  const localStorePath = path.join(process.cwd(), 'src/lib/db/local_store.json');
  if (!fs.existsSync(localStorePath)) {
    console.error('❌ local_store.json not found!');
    process.exit(1);
  }

  const store = JSON.parse(fs.readFileSync(localStorePath, 'utf8'));

  // 1. Lotteries
  if (Array.isArray(store.lotteries) && store.lotteries.length > 0) {
    console.log(`📦 Upserting ${store.lotteries.length} Lotteries...`);
    const { error } = await supabase.from('lotteries').upsert(store.lotteries, { onConflict: 'id' });
    if (error) console.error('  ⚠️  Error lotteries:', error.message);
    else console.log('  ✅ Lotteries synced successfully.');
  }

  // 1b. Scheme Versions
  const validSchemeIds = new Set(['scheme-kn-v1', 'scheme-br-v1']);
  const schemes = [
    {
      id: "scheme-kn-v1",
      lottery_id: "lottery-kn",
      version: "2026.1",
      effective_from: "2026-01-01",
      ticket_price: 50,
      series_count: 12,
      series_codes: ["MN", "MO", "MP", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ"],
      prize_rules: [],
      source_document: "Govt_Gazette_Lottery_Rules_2026.pdf",
      source_document_hash: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      verified_at: "2026-01-01T00:00:00Z"
    },
    {
      id: "scheme-br-v1",
      lottery_id: "lottery-br",
      version: "2026.THIRUVONAM",
      effective_from: "2026-07-01",
      ticket_price: 500,
      series_count: 10,
      series_codes: ["TA", "TB", "TC", "TD", "TE", "TG", "TH", "TJ", "TK", "TL"],
      prize_rules: [],
      source_document: "Thiruvonam_Bumper_2026_Gazette.pdf",
      source_document_hash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
      verified_at: "2026-07-01T00:00:00Z"
    }
  ];
  await supabase.from('lottery_scheme_versions').upsert(schemes, { onConflict: 'id' });

  // 2. Source Files
  if (Array.isArray(store.sourceFiles) && store.sourceFiles.length > 0) {
    console.log(`📦 Upserting ${store.sourceFiles.length} Source Files...`);
    const { error } = await supabase.from('source_files').upsert(store.sourceFiles, { onConflict: 'id' });
    if (error) console.error('  ⚠️  Error source_files:', error.message);
    else console.log('  ✅ Source Files synced successfully.');
  }

  // 3. Draws
  if (Array.isArray(store.draws) && store.draws.length > 0) {
    console.log(`📦 Upserting ${store.draws.length} Draws...`);
    // Exclude virtual/joined fields if any
    const drawsPayload = store.draws.map((d: any) => ({
      id: d.id,
      lottery_id: d.lottery_id,
      scheme_version_id: validSchemeIds.has(d.scheme_version_id) ? d.scheme_version_id : null,
      draw_number: d.draw_number,
      draw_date: d.draw_date,
      draw_time: d.draw_time || '15:00:00',
      venue: d.venue,
      source_file_id: d.source_file_id || null,
      status: d.status,
      series_list: d.series_list || [],
      confidence_score: d.confidence_score || 100.0,
      ocr_used: d.ocr_used || false,
      verification_notes: d.verification_notes || '',
      result_version: d.result_version || 1,
      published_at: d.published_at || null,
      created_at: d.created_at || new Date().toISOString(),
      updated_at: d.updated_at || new Date().toISOString()
    }));
    const { error } = await supabase.from('draws').upsert(drawsPayload, { onConflict: 'id' });
    if (error) console.error('  ⚠️  Error draws:', error.message);
    else console.log('  ✅ Draws synced successfully.');
  }

  // 4. Prize Categories
  if (Array.isArray(store.categories) && store.categories.length > 0) {
    console.log(`📦 Upserting ${store.categories.length} Prize Categories...`);
    const { error } = await supabase.from('prize_categories').upsert(store.categories, { onConflict: 'id' });
    if (error) console.error('  ⚠️  Error categories:', error.message);
    else console.log('  ✅ Prize Categories synced successfully.');
  }

  // 5. Winning Entries (Batch by 200)
  if (Array.isArray(store.winningEntries) && store.winningEntries.length > 0) {
    console.log(`📦 Upserting ${store.winningEntries.length} Winning Entries in batches...`);
    const chunkSize = 200;
    let successCount = 0;
    for (let i = 0; i < store.winningEntries.length; i += chunkSize) {
      const chunk = store.winningEntries.slice(i, i + chunkSize).map((w: any) => ({
        id: w.id,
        draw_id: w.draw_id,
        prize_category_id: w.prize_category_id,
        series: w.series || null,
        ticket_number: w.ticket_number,
        full_ticket: w.full_ticket || null,
        matched_suffix: w.matched_suffix || null,
        is_consolation: w.is_consolation || false,
        source_line: w.source_line || null,
        source_page: w.source_page || 1
      }));
      const { error } = await supabase.from('winning_entries').upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.error(`  ⚠️  Error batch ${i / chunkSize + 1}:`, error.message);
      } else {
        successCount += chunk.length;
      }
    }
    console.log(`  ✅ Synced ${successCount} winning entries.`);
  }

  console.log('\n🎉 Complete! Supabase has been fully populated with all lottery draws and winning data.');
}

seed().catch(err => {
  console.error('Fatal error during seed:', err);
  process.exit(1);
});
