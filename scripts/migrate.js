// scripts/migrate.js - Supabase Database Schema Migration
import pg from 'pg';
const { Client } = pg;

const client = new Client({
	host: 'db.zbwivkhimowvrmwdexfc.supabase.co',
	port: 5432,
	user: 'postgres',
	password: process.env.SUPABASE_DATABASE_PASSWORD || 'Lp7O96sGfgiz8ijM',
	database: 'postgres',
	ssl: { rejectUnauthorized: false }
});

const SCHEMA_SQL = `
-- 1. Profiles Table (sync with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    phone TEXT,
    tier TEXT DEFAULT 'free', -- 'free' | 'premium'
    role TEXT DEFAULT 'user', -- 'user' | 'admin'
    package_name TEXT DEFAULT 'Paket Gratis',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Weddings Data Table
CREATE TABLE IF NOT EXISTS public.weddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE,
    template_id TEXT DEFAULT 'champagne-gold',
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders / Transactions Table (WhatsApp Payment & Admin Verification)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    package_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT DEFAULT 'whatsapp',
    status TEXT DEFAULT 'PENDING', -- 'PENDING' | 'PAID' | 'CANCELLED'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- 4. RSVPs Table
CREATE TABLE IF NOT EXISTS public.rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID REFERENCES public.weddings(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    kehadiran TEXT NOT NULL,
    jumlah INT DEFAULT 1,
    ucapan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid errors on rerun
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access profiles" ON public.profiles;

DROP POLICY IF EXISTS "Public weddings viewable" ON public.weddings;
DROP POLICY IF EXISTS "Users can manage own wedding" ON public.weddings;

DROP POLICY IF EXISTS "Allow public orders insert" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

DROP POLICY IF EXISTS "Public can view rsvps" ON public.rsvps;
DROP POLICY IF EXISTS "Public can insert rsvp" ON public.rsvps;

-- Permissive policies for web application
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR ALL USING (true);

CREATE POLICY "Public weddings viewable" ON public.weddings FOR SELECT USING (true);
CREATE POLICY "Users can manage own wedding" ON public.weddings FOR ALL USING (true);

CREATE POLICY "Allow public orders insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Users can update own orders" ON public.orders FOR UPDATE USING (true);

CREATE POLICY "Public can view rsvps" ON public.rsvps FOR SELECT USING (true);
CREATE POLICY "Public can insert rsvp" ON public.rsvps FOR INSERT WITH CHECK (true);

-- Auto create profile on auth signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, phone, tier, package_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'tier', 'free'),
        CASE WHEN COALESCE(NEW.raw_user_meta_data->>'tier', 'free') = 'premium' THEN 'Paket Premium All-in-One' ELSE 'Paket Gratis' END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, profiles.name),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        tier = COALESCE(EXCLUDED.tier, profiles.tier);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Direct user creation (Bypasses email rate limit for Free & Admin users!)
CREATE OR REPLACE FUNCTION public.register_user_direct(
    p_email TEXT,
    p_password TEXT,
    p_name TEXT,
    p_phone TEXT,
    p_tier TEXT DEFAULT 'free'
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_enc_pw TEXT;
    v_clean_email TEXT := LOWER(TRIM(p_email));
    v_identity_data JSONB;
    v_tier TEXT := COALESCE(p_tier, 'free');
BEGIN
    IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = v_clean_email) THEN
        RAISE EXCEPTION 'Email "%" sudah terdaftar. Silakan langsung masuk dengan kata sandi Anda.', v_clean_email;
    END IF;

    v_enc_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

    v_identity_data := jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_clean_email,
        'full_name', p_name,
        'phone', p_phone,
        'tier', v_tier,
        'email_verified', true,
        'phone_verified', false
    );

    -- 1. Insert into auth.users (Instant active, no email rate limit)
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        phone_change,
        phone_change_token,
        reauthentication_token,
        is_sso_user,
        is_anonymous
    )
    VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        v_clean_email,
        v_enc_pw,
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        v_identity_data,
        'authenticated',
        'authenticated',
        NOW(),
        NOW(),
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        false,
        false
    );

    -- 2. Insert into auth.identities (GoTrue identity)
    INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        v_user_id,
        v_user_id::text,
        v_identity_data,
        'email',
        NOW(),
        NOW(),
        NOW()
    );

    -- 3. Insert into public.profiles
    INSERT INTO public.profiles (
        id,
        email,
        name,
        phone,
        tier,
        package_name
    )
    VALUES (
        v_user_id,
        v_clean_email,
        p_name,
        p_phone,
        v_tier,
        CASE WHEN v_tier = 'premium' THEN 'Paket Premium All-in-One' ELSE 'Paket Gratis' END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        tier = EXCLUDED.tier,
        package_name = EXCLUDED.package_name;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.register_user_direct TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.register_free_user(
    p_email TEXT,
    p_password TEXT,
    p_name TEXT,
    p_phone TEXT,
    p_tier TEXT DEFAULT 'free'
)
RETURNS UUID AS $$
BEGIN
    RETURN public.register_user_direct(p_email, p_password, p_name, p_phone, p_tier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.register_free_user TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
`;

async function runMigration() {
	try {
		console.log('⏳ Connecting to Supabase PostgreSQL database...');
		await client.connect();
		console.log('✅ Connected successfully!');

		console.log('🚀 Running database schema migration...');
		await client.query(SCHEMA_SQL);
		console.log('✅ Database migration completed successfully!');

		const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

		console.log('📊 Active public tables:');
		res.rows.forEach((row) => console.log('   - ' + row.table_name));
	} catch (err) {
		console.error('❌ Migration failed:', err);
		process.exit(1);
	} finally {
		await client.end();
	}
}

runMigration();
