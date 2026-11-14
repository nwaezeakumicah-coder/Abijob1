-- Enable only the status/read-receipt fields protected by existing RLS policies.
GRANT UPDATE (status) ON TABLE public.job_applications TO authenticated;
GRANT UPDATE (read_at) ON TABLE public.messages TO authenticated;
