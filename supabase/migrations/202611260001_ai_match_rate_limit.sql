-- Per-user quota for consent-based Gemini job matching.
create table if not exists public.ai_match_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);

alter table public.ai_match_rate_limits enable row level security;
revoke all on table public.ai_match_rate_limits from public, anon, authenticated;

create or replace function public.consume_ai_match_quota()
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := now();
  v_count integer;
begin
  if v_user_id is null then
    return false;
  end if;

  insert into public.ai_match_rate_limits (user_id, window_started_at, request_count)
  values (v_user_id, v_now, 1)
  on conflict (user_id) do update
    set window_started_at = case
          when public.ai_match_rate_limits.window_started_at <= v_now - interval '1 hour'
          then v_now
          else public.ai_match_rate_limits.window_started_at
        end,
        request_count = case
          when public.ai_match_rate_limits.window_started_at <= v_now - interval '1 hour'
          then 1
          else public.ai_match_rate_limits.request_count + 1
        end
  returning request_count into v_count;

  return v_count <= 10;
end;
$$;

revoke all on function public.consume_ai_match_quota() from public, anon;
grant execute on function public.consume_ai_match_quota() to authenticated;
