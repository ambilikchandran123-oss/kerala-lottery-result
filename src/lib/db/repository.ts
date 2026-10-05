import { 
  Lottery, 
  Draw, 
  PrizeCategory, 
  WinningEntry, 
  SourceFile, 
  ResultAuditLog, 
  CheckTicketResult, 
  DrawStatus 
} from '@/types/lottery';
import { 
  SEED_LOTTERIES, 
  SEED_DRAWS, 
  SEED_PRIZE_CATEGORIES, 
  SEED_WINNING_ENTRIES, 
  SEED_SOURCE_FILES 
} from './seedData';
import { supabasePublic, supabaseAdmin, isSupabaseConfigured } from './supabase';
import { checkTicket as evaluateTicket } from '../engine/matcher';
import { ParseResult } from '../parser/txtParser';

import fs from 'fs';
import path from 'path';

// In-Memory & File-backed fallback for zero-downtime, local tests, and persistence
class InMemoryLotteryStore {
  lotteries: Lottery[] = [...SEED_LOTTERIES];
  draws: Draw[] = [...SEED_DRAWS];
  categories: PrizeCategory[] = [...SEED_PRIZE_CATEGORIES];
  winningEntries: WinningEntry[] = [...SEED_WINNING_ENTRIES];
  sourceFiles: SourceFile[] = [...SEED_SOURCE_FILES];
  auditLogs: ResultAuditLog[] = [];
}

const PERSISTENCE_FILE = path.join(process.cwd(), 'src/lib/db/local_store.json');

function initLocalStore(): InMemoryLotteryStore {
  const store = new InMemoryLotteryStore();
  try {
    if (fs.existsSync(PERSISTENCE_FILE)) {
      const raw = fs.readFileSync(PERSISTENCE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.draws)) {
        for (const d of data.draws) {
          const idx = store.draws.findIndex(x => x.id === d.id);
          if (idx >= 0) store.draws[idx] = d;
          else store.draws.push(d);
        }
      }
      if (Array.isArray(data.categories)) {
        for (const c of data.categories) {
          const idx = store.categories.findIndex(x => x.id === c.id);
          if (idx >= 0) store.categories[idx] = c;
          else store.categories.push(c);
        }
      }
      if (Array.isArray(data.winningEntries)) {
        for (const e of data.winningEntries) {
          const idx = store.winningEntries.findIndex(x => x.id === e.id);
          if (idx >= 0) store.winningEntries[idx] = e;
          else store.winningEntries.push(e);
        }
      }
      if (Array.isArray(data.sourceFiles)) {
        for (const sf of data.sourceFiles) {
          const idx = store.sourceFiles.findIndex(x => x.id === sf.id);
          if (idx >= 0) store.sourceFiles[idx] = sf;
          else store.sourceFiles.push(sf);
        }
      }
      if (Array.isArray(data.lotteries)) {
        for (const l of data.lotteries) {
          const idx = store.lotteries.findIndex(x => x.id === l.id);
          if (idx >= 0) store.lotteries[idx] = l;
          else store.lotteries.push(l);
        }
      }
    }
  } catch (err) {
    console.warn('Error reading local_store.json fallback:', err);
  }
  return store;
}

export function persistLocalStore(store: InMemoryLotteryStore) {
  try {
    fs.writeFileSync(
      PERSISTENCE_FILE,
      JSON.stringify(
        {
          lotteries: store.lotteries,
          draws: store.draws,
          categories: store.categories,
          winningEntries: store.winningEntries,
          sourceFiles: store.sourceFiles
        },
        null,
        2
      )
    );
    try {
      lastStoreSyncTime = fs.statSync(PERSISTENCE_FILE).mtimeMs;
    } catch {
      lastStoreSyncTime = Date.now();
    }
  } catch (err) {
    console.warn('Could not persist local_store.json:', err);
  }
}

let localStore = initLocalStore();
let lastStoreSyncTime = 0;

export function getLocalStore(): InMemoryLotteryStore {
  try {
    if (fs.existsSync(PERSISTENCE_FILE)) {
      const stat = fs.statSync(PERSISTENCE_FILE);
      if (stat.mtimeMs > lastStoreSyncTime) {
        lastStoreSyncTime = stat.mtimeMs;
        localStore = initLocalStore();
      }
    }
  } catch (e) {
    console.warn('Error syncing store from disk:', e);
  }
  return localStore;
}

export const LotteryRepository = {
  /**
   * Get all active lotteries
   */
  async getLotteries(): Promise<Lottery[]> {
    if (isSupabaseConfigured && supabasePublic) {
      try {
        const { data, error } = await supabasePublic
          .from('lotteries')
          .select('*')
          .eq('active', true)
          .order('name_en', { ascending: true });
        if (!error && data && data.length > 0) return data as Lottery[];
      } catch (err) {
        console.warn('Supabase fetch error, falling back to local store:', err);
      }
    }
    const store = getLocalStore();
    return store.lotteries.filter(l => l.active);
  },

  /**
   * Get published draws with optional filters
   */
  async getPublishedDraws(lotteryId?: string, drawDate?: string): Promise<Draw[]> {
    if (isSupabaseConfigured && supabasePublic) {
      try {
        let query = supabasePublic
          .from('draws')
          .select('*, lottery:lotteries(*), source_file:source_files(*)')
          .eq('status', 'PUBLISHED')
          .order('draw_date', { ascending: false });

        if (lotteryId) query = query.eq('lottery_id', lotteryId);
        if (drawDate) query = query.eq('draw_date', drawDate);

        const { data, error } = await query;
        if (!error && data) return data as Draw[];
      } catch (err) {
        console.warn('Supabase fetch error, falling back to local store:', err);
      }
    }

    const store = getLocalStore();
    let draws = store.draws.filter(d => d.status === 'PUBLISHED');
    if (lotteryId) draws = draws.filter(d => d.lottery_id === lotteryId);
    if (drawDate) draws = draws.filter(d => d.draw_date === drawDate);

    // Attach lottery and source_file, sorting by date descending, then time descending
    return draws.map(d => ({
      ...d,
      lottery: store.lotteries.find(l => l.id === d.lottery_id),
      source_file: store.sourceFiles.find(sf => sf.id === d.source_file_id)
    })).sort((a, b) => {
      if (b.draw_date !== a.draw_date) {
        return b.draw_date.localeCompare(a.draw_date);
      }
      const aTime = a.published_at || a.created_at || '';
      const bTime = b.published_at || b.created_at || '';
      return bTime.localeCompare(aTime);
    });
  },

  /**
   * Get a draw by its ID
   */
  async getDrawById(drawId: string): Promise<Draw | null> {
    if (isSupabaseConfigured && supabasePublic) {
      try {
        const { data, error } = await supabasePublic
          .from('draws')
          .select('*, lottery:lotteries(*), source_file:source_files(*)')
          .eq('id', drawId)
          .single();
        if (!error && data) return data as Draw;
      } catch (err) {
        console.warn('Supabase fetch error, falling back to local store:', err);
      }
    }

    const store = getLocalStore();
    const d = store.draws.find(item => item.id === drawId);
    if (!d) return null;

    return {
      ...d,
      lottery: store.lotteries.find(l => l.id === d.lottery_id),
      source_file: store.sourceFiles.find(sf => sf.id === d.source_file_id)
    };
  },

  /**
   * Get today's published result or the most recent published draw
   */
  async getTodayOrLatestDraw(): Promise<Draw | null> {
    const today = new Date().toISOString().split('T')[0];
    const todayDraws = await this.getPublishedDraws(undefined, today);
    if (todayDraws.length > 0) return todayDraws[0];

    // If today's result is not published yet, return latest published
    const all = await this.getPublishedDraws();
    return all.length > 0 ? all[0] : null;
  },

  /**
   * Check if a source document hash (SHA-256) already exists in database
   */
  async isSourceHashImported(sha256: string): Promise<boolean> {
    if (isSupabaseConfigured && supabasePublic) {
      try {
        const { count, error } = await supabasePublic
          .from('source_files')
          .select('*', { count: 'exact', head: true })
          .eq('sha256', sha256);
        if (!error && count !== null) return count > 0;
      } catch (err) {
        console.warn('Supabase hash check error:', err);
      }
    }
    const store = getLocalStore();
    return store.sourceFiles.some(sf => sf.sha256 === sha256);
  },

  /**
   * Load categories for a draw
   */
  async getPrizeCategories(drawId: string): Promise<PrizeCategory[]> {
    if (isSupabaseConfigured && supabasePublic) {
      try {
        const { data, error } = await supabasePublic
          .from('prize_categories')
          .select('*')
          .eq('draw_id', drawId)
          .order('priority', { ascending: true });
        if (!error && data) return data as PrizeCategory[];
      } catch (err) {
        console.warn('Supabase categories error:', err);
      }
    }
    const store = getLocalStore();
    return store.categories
      .filter(c => c.draw_id === drawId)
      .sort((a, b) => a.priority - b.priority);
  },

  /**
   * Load winning entries for a draw
   */
  async getWinningEntries(drawId: string): Promise<WinningEntry[]> {
    if (isSupabaseConfigured && supabasePublic) {
      try {
        const { data, error } = await supabasePublic
          .from('winning_entries')
          .select('*')
          .eq('draw_id', drawId);
        if (!error && data) return data as WinningEntry[];
      } catch (err) {
        console.warn('Supabase entries error:', err);
      }
    }
    const store = getLocalStore();
    return store.winningEntries
      .filter(w => w.draw_id === drawId)
      .map(w => ({
        ...w,
        prize_category: store.categories.find(c => c.id === w.prize_category_id)
      }));
  },

  /**
   * Check a ticket against a specific draw
   */
  async verifyTicket(
    drawId: string,
    rawInput: string,
    series?: string,
    ticketNumber?: string
  ): Promise<CheckTicketResult> {
    const draw = await this.getDrawById(drawId);
    if (!draw) {
      return {
        status: 'ERROR',
        verified: false,
        message: 'The selected draw was not found.'
      };
    }

    if (draw.status !== 'PUBLISHED') {
      return {
        status: 'DRAW_NOT_PUBLISHED',
        verified: false,
        message: draw.status === 'PROCESSING' || draw.status === 'NEEDS_VERIFICATION'
          ? "Today's result is being verified. Please check back shortly."
          : 'The official result has not been uploaded yet.'
      };
    }

    const categories = await this.getPrizeCategories(drawId);
    const entries = await this.getWinningEntries(drawId);

    return evaluateTicket(draw, categories, entries, rawInput, series, ticketNumber);
  },

  /**
   * Ingest and save an imported draw from parsed result data
   */
  async saveImportedDraw(
    parsed: ParseResult,
    sourceFileName: string,
    sha256: string,
    pdfPublicUrl?: string
  ): Promise<{ drawId: string; status: DrawStatus }> {
    const store = getLocalStore();

    // 1. Check duplicate SHA-256
    const exists = await this.isSourceHashImported(sha256);
    if (exists) {
      throw new Error('This exact result document has already been imported (SHA-256 match).');
    }

    // 2. Find or match lottery
    let lottery = store.lotteries.find(l => l.code === parsed.lotteryCode);
    if (!lottery) {
      lottery = {
        id: `lottery-${parsed.lotteryCode.toLowerCase()}`,
        code: parsed.lotteryCode,
        name_en: parsed.lotteryNameEn,
        name_ml: parsed.lotteryNameMl,
        type: parsed.lotteryNameEn.toUpperCase().includes('BUMPER') ? 'BUMPER' : 'WEEKLY',
        active: true
      };
      store.lotteries.push(lottery);
    }

    // 3. Status determination based on confidence and OCR
    const initialStatus: DrawStatus = (parsed.confidence === 'HIGH' && !parsed.ocrUsed && parsed.success)
      ? 'VERIFIED'
      : 'NEEDS_VERIFICATION';

    const drawId = `draw-${parsed.drawNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const sourceFileId = `source-${drawId}`;

    const sourceFile: SourceFile = {
      id: sourceFileId,
      draw_id: drawId,
      filename: sourceFileName,
      mime_type: sourceFileName.endsWith('.pdf') ? 'application/pdf' : 'text/plain',
      sha256,
      storage_path: `official-results/${sourceFileName}`,
      public_url: pdfPublicUrl || `/samples/${sourceFileName}`,
      raw_text: parsed.rawText,
      parser_version: '1.0.0',
      uploaded_at: new Date().toISOString()
    };

    const draw: Draw = {
      id: drawId,
      lottery_id: lottery.id,
      draw_number: parsed.drawNumber,
      draw_date: parsed.drawDate,
      venue: parsed.venue,
      source_file_id: sourceFileId,
      status: initialStatus,
      series_list: parsed.seriesList,
      confidence_score: parsed.confidenceScore,
      ocr_used: parsed.ocrUsed,
      verification_notes: parsed.warnings.join(' | ') || 'Imported via official parser pipeline.',
      result_version: 1,
      published_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    store.sourceFiles.push(sourceFile);
    store.draws.push(draw);

    // Save categories and entries
    for (const cat of parsed.categories) {
      const categoryId = `cat-${drawId}-${cat.categoryCode.toLowerCase()}`;
      const prizeCat: PrizeCategory = {
        id: categoryId,
        draw_id: drawId,
        category_code: cat.categoryCode,
        category_name_en: cat.nameEn,
        category_name_ml: cat.nameMl,
        prize_amount: cat.amount,
        match_type: cat.matchType,
        match_digits: cat.matchDigits,
        series_scope: cat.seriesScope,
        priority: cat.priority
      };
      store.categories.push(prizeCat);

      for (let i = 0; i < cat.entries.length; i++) {
        const ent = cat.entries[i];
        store.winningEntries.push({
          id: `win-${categoryId}-${i}`,
          draw_id: drawId,
          prize_category_id: categoryId,
          series: ent.series,
          ticket_number: ent.ticketNumber,
          full_ticket: ent.fullTicket,
          matched_suffix: ent.matchedSuffix,
          is_consolation: ent.isConsolation,
          source_line: ent.sourceLine,
          source_page: ent.sourcePage || 1
        });
      }
    }

    // Audit log
    const auditRecord: ResultAuditLog = {
      id: `audit-${Date.now()}`,
      draw_id: drawId,
      action: 'IMPORT',
      new_version: 1,
      reason: `Imported official source file ${sourceFileName} with confidence ${parsed.confidence}`,
      performed_by: 'admin_importer',
      timestamp: new Date().toISOString()
    };
    store.auditLogs.push(auditRecord);

    persistLocalStore(store);

    // If Supabase is configured, sync to Supabase PostgreSQL database
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from('lotteries').upsert(lottery, { onConflict: 'id' });
        await supabaseAdmin.from('source_files').upsert(sourceFile, { onConflict: 'id' });
        await supabaseAdmin.from('draws').upsert(draw, { onConflict: 'id' });

        const cats = store.categories.filter(c => c.draw_id === drawId);
        if (cats.length > 0) {
          await supabaseAdmin.from('prize_categories').upsert(cats, { onConflict: 'id' });
        }

        const entries = store.winningEntries.filter(w => w.draw_id === drawId);
        const chunkSize = 200;
        for (let i = 0; i < entries.length; i += chunkSize) {
          const chunk = entries.slice(i, i + chunkSize);
          await supabaseAdmin.from('winning_entries').upsert(chunk, { onConflict: 'id' });
        }
      } catch (sbErr) {
        console.warn('Supabase ingestion error, fallback maintained:', sbErr);
      }
    }

    return { drawId, status: initialStatus };
  },

  /**
   * Admin approves & publishes a verified draw
   */
  async publishDraw(drawId: string, performedBy: string = 'authorized_admin', reason: string = 'Official result verified'): Promise<Draw> {
    const store = getLocalStore();
    const draw = store.draws.find(d => d.id === drawId);
    if (!draw) throw new Error('Draw not found.');

    draw.status = 'PUBLISHED';
    draw.published_at = new Date().toISOString();
    draw.updated_at = new Date().toISOString();

    const auditRecord: ResultAuditLog = {
      id: `audit-${Date.now()}`,
      draw_id: drawId,
      action: 'PUBLISH',
      new_version: draw.result_version,
      reason,
      performed_by: performedBy,
      timestamp: new Date().toISOString()
    };
    store.auditLogs.push(auditRecord);

    persistLocalStore(store);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('draws')
          .update({
            status: 'PUBLISHED',
            published_at: draw.published_at,
            updated_at: draw.updated_at
          })
          .eq('id', drawId);
      } catch (sbErr) {
        console.warn('Supabase publish update error:', sbErr);
      }
    }

    return draw;
  }
};
