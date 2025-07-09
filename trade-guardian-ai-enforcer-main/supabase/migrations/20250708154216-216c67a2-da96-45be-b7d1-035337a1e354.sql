-- Add MetaApi account ID field to mt5_accounts table
ALTER TABLE public.mt5_accounts 
ADD COLUMN metaapi_account_id TEXT;