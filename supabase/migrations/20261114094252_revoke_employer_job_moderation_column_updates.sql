-- Remove leftover employer privileges on moderation-only job fields.
-- Employers may edit pending vacancy content, but cannot change publication
-- status, publication timestamps, or moderation feedback.
REVOKE UPDATE (status, published_at, rejection_reason)
  ON TABLE public.jobs FROM authenticated;

GRANT UPDATE (contact_email, workplace, workplace_type)
  ON TABLE public.jobs TO authenticated;
