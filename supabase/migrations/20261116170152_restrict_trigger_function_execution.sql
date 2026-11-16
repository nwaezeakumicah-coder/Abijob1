-- Trigger functions are invoked by PostgreSQL triggers, not directly by API clients.
-- Remove default PUBLIC execution and explicit API-role execution to prevent callers
-- from invoking SECURITY DEFINER trigger bodies as standalone RPC endpoints.
REVOKE ALL ON FUNCTION public.mark_employer_verification_pending() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_professional_verification_pending() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_interview_participants() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_matching_job_alerts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_verification_decision() FROM PUBLIC, anon, authenticated;
