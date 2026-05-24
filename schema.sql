-- =============================================
-- MEG PAYMENT GATEWAY - SUPABASE SCHEMA
-- Jalankan di Supabase SQL Editor
-- =============================================

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  saldo BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys table
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  label TEXT DEFAULT 'Default Key',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ
);

-- Transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('topup', 'debit', 'credit')),
  amount BIGINT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  reference TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  webhook_url TEXT,
  webhook_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topup requests table (user request topup, admin confirm)
CREATE TABLE topup_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  unique_code INT DEFAULT 0,
  total_transfer BIGINT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook logs table
CREATE TABLE webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id),
  url TEXT NOT NULL,
  payload JSONB,
  response_status INT,
  response_body TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performance
CREATE INDEX idx_api_keys_key ON api_keys(key);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_topup_requests_user_id ON topup_requests(user_id);

-- Admin default (ganti password setelah deploy!)
-- Password: admin123 (bcrypt hash)
INSERT INTO users (name, email, password, role, saldo)
VALUES (
  'Admin',
  'admin@megpg.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  0
);
