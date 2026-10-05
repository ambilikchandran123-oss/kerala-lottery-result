-- ==============================================================================
-- KERALA STATE LOTTERIES HIGH-ACCURACY VERIFICATION SCHEMA
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Lotteries Table
CREATE TABLE IF NOT EXISTS lotteries (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code VARCHAR(20) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_ml VARCHAR(150) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('WEEKLY', 'BUMPER')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_lottery_code_name UNIQUE (code, name_en)
);

-- 2. Lottery Scheme Versions Table
-- Preserves lottery-specific, versioned prize structures over time
CREATE TABLE IF NOT EXISTS lottery_scheme_versions (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    lottery_id VARCHAR(100) NOT NULL REFERENCES lotteries(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    ticket_price NUMERIC(10, 2) NOT NULL,
    series_count INT NOT NULL,
    series_codes TEXT[] NOT NULL DEFAULT '{}',
    prize_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_document VARCHAR(255),
    source_document_hash VARCHAR(64),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_lottery_version UNIQUE (lottery_id, version)
);

-- 3. Source Files Table
-- Every source document is hashed with SHA-256 for provenance & duplicate prevention
CREATE TABLE IF NOT EXISTS source_files (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    draw_id VARCHAR(100),
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    sha256 VARCHAR(64) NOT NULL UNIQUE,
    storage_path VARCHAR(500) NOT NULL,
    public_url TEXT,
    raw_text TEXT,
    parser_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Draws Table
-- Master record for each official lottery draw
CREATE TABLE IF NOT EXISTS draws (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    lottery_id VARCHAR(100) NOT NULL REFERENCES lotteries(id),
    scheme_version_id VARCHAR(100) REFERENCES lottery_scheme_versions(id),
    draw_number VARCHAR(50) NOT NULL,
    draw_date DATE NOT NULL,
    draw_time TIME DEFAULT '15:00:00',
    venue VARCHAR(255) DEFAULT 'Gorky Bhavan, Near Gandhari Amman Kovil, Thiruvananthapuram',
    source_file_id VARCHAR(100) REFERENCES source_files(id),
    status VARCHAR(30) NOT NULL CHECK (
        status IN ('DRAFT', 'PROCESSING', 'NEEDS_VERIFICATION', 'VERIFIED', 'PUBLISHED', 'ARCHIVED', 'REJECTED')
    ) DEFAULT 'DRAFT',
    series_list TEXT[] DEFAULT '{}',
    confidence_score NUMERIC(5, 2) DEFAULT 100.0,
    ocr_used BOOLEAN NOT NULL DEFAULT false,
    verification_notes TEXT,
    result_version INT NOT NULL DEFAULT 1,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_lottery_draw UNIQUE (lottery_id, draw_number)
);

-- Source files can optionally store draw_id for loose reference without circular constraint


-- 5. Prize Categories Table
-- Draw-specific prize tier configuration
CREATE TABLE IF NOT EXISTS prize_categories (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    draw_id VARCHAR(100) NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
    category_code VARCHAR(30) NOT NULL,
    category_name_en VARCHAR(100) NOT NULL,
    category_name_ml VARCHAR(150) NOT NULL,
    prize_amount NUMERIC(14, 2) NOT NULL,
    match_type VARCHAR(30) NOT NULL CHECK (
        match_type IN ('EXACT_FULL_TICKET', 'EXACT_NUMBER_PER_SERIES', 'CONSOLATION', 'LAST_N_DIGITS', 'OTHER_RULE')
    ),
    match_digits INT DEFAULT 6,
    series_scope VARCHAR(30) DEFAULT 'ALL_SERIES',
    priority INT NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Winning Entries Table
-- Granular, traceable winning ticket entries
CREATE TABLE IF NOT EXISTS winning_entries (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    draw_id VARCHAR(100) NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
    prize_category_id VARCHAR(100) NOT NULL REFERENCES prize_categories(id) ON DELETE CASCADE,
    series VARCHAR(10),
    ticket_number VARCHAR(10) NOT NULL,
    full_ticket VARCHAR(20),
    matched_suffix VARCHAR(10),
    is_consolation BOOLEAN NOT NULL DEFAULT false,
    source_line INT,
    source_page INT DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Result Audit Log Table
-- Enforces compliance, tracking transitions, corrections and publishing actions
CREATE TABLE IF NOT EXISTS result_audit_log (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    draw_id VARCHAR(100) NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
    action VARCHAR(30) NOT NULL CHECK (
        action IN ('IMPORT', 'VERIFY', 'PUBLISH', 'CORRECT', 'ARCHIVE', 'REJECT')
    ),
    old_version INT,
    new_version INT,
    reason TEXT,
    performed_by VARCHAR(100) DEFAULT 'system_admin',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- PERFORMANCE INDEXES (Mandatory for high-accuracy rapid query resolution)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_winning_draw_number ON winning_entries(draw_id, ticket_number);
CREATE INDEX IF NOT EXISTS idx_winning_draw_series_number ON winning_entries(draw_id, series, ticket_number);
CREATE INDEX IF NOT EXISTS idx_winning_suffix ON winning_entries(draw_id, matched_suffix);
CREATE INDEX IF NOT EXISTS idx_draw_date ON draws(draw_date);
CREATE INDEX IF NOT EXISTS idx_draws_status ON draws(status);
CREATE INDEX IF NOT EXISTS idx_source_files_sha256 ON source_files(sha256);
CREATE INDEX IF NOT EXISTS idx_prize_categories_draw ON prize_categories(draw_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE lotteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_scheme_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE winning_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_audit_log ENABLE ROW LEVEL SECURITY;

-- 1. Lotteries: Public read active lotteries, no public write
DROP POLICY IF EXISTS "Public lotteries viewable" ON lotteries;
CREATE POLICY "Public lotteries viewable" ON lotteries
    FOR SELECT TO anon, authenticated
    USING (active = true);

-- 2. Scheme Versions: Public read-only
DROP POLICY IF EXISTS "Public scheme versions viewable" ON lottery_scheme_versions;
CREATE POLICY "Public scheme versions viewable" ON lottery_scheme_versions
    FOR SELECT TO anon, authenticated
    USING (true);

-- 3. Draws: Public can ONLY view PUBLISHED draws
DROP POLICY IF EXISTS "Public draws published only" ON draws;
CREATE POLICY "Public draws published only" ON draws
    FOR SELECT TO anon, authenticated
    USING (status = 'PUBLISHED');

-- 4. Source Files: Public can only view files attached to PUBLISHED draws
DROP POLICY IF EXISTS "Public source files published only" ON source_files;
CREATE POLICY "Public source files published only" ON source_files
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM draws 
            WHERE draws.id = source_files.draw_id 
            AND draws.status = 'PUBLISHED'
        )
    );

-- 5. Prize Categories: Public can only view for PUBLISHED draws
DROP POLICY IF EXISTS "Public prize categories published only" ON prize_categories;
CREATE POLICY "Public prize categories published only" ON prize_categories
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM draws 
            WHERE draws.id = prize_categories.draw_id 
            AND draws.status = 'PUBLISHED'
        )
    );

-- 6. Winning Entries: Public can only view for PUBLISHED draws
DROP POLICY IF EXISTS "Public winning entries published only" ON winning_entries;
CREATE POLICY "Public winning entries published only" ON winning_entries
    FOR SELECT TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM draws 
            WHERE draws.id = winning_entries.draw_id 
            AND draws.status = 'PUBLISHED'
        )
    );

-- 7. Audit Log: Inaccessible to public anonymous users
DROP POLICY IF EXISTS "Audit logs internal only" ON result_audit_log;
CREATE POLICY "Audit logs internal only" ON result_audit_log
    FOR SELECT TO authenticated
    USING (false);

-- Service role bypasses RLS by default in Supabase, allowing ingestion scripts to write.
