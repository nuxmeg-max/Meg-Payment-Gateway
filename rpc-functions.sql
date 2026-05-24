-- =============================================
-- TAMBAHAN RPC FUNCTIONS - jalankan setelah schema.sql
-- =============================================

-- Function: kurangi saldo (atomic)
CREATE OR REPLACE FUNCTION deduct_saldo(user_id UUID, amount BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET saldo = saldo - amount
  WHERE id = user_id AND saldo >= amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Saldo tidak mencukupi';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: tambah saldo (atomic)
CREATE OR REPLACE FUNCTION add_saldo(user_id UUID, amount BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET saldo = saldo + amount
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
