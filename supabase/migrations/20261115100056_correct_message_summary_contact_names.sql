CREATE OR REPLACE FUNCTION public.get_message_conversation_summaries()
 RETURNS TABLE(conversation_kind text, conversation_id uuid, contact_id uuid, contact_name text, contact_role text, business_name text, avatar_url text, job_title text, last_message text, last_message_at timestamp with time zone, unread_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  with application_conversations as (
    select
      'application'::text as conversation_kind,
      c.application_id as conversation_id,
      c.contact_id,
      case
        when c.contact_role = 'applicant' then
          coalesce(nullif(pg_catalog.btrim(c.contact_name), ''), 'Applicant')
        else
          coalesce(
            nullif(pg_catalog.btrim(c.business_name), ''),
            nullif(pg_catalog.btrim(c.contact_name), ''),
            'Employer'
          )
      end as contact_name,
      c.contact_role,
      c.business_name,
      c.avatar_url,
      c.job_title
    from public.get_message_contacts() c
  ),
  direct_conversations as (
    select
      'direct'::text as conversation_kind,
      c.conversation_id,
      c.contact_id,
      coalesce(nullif(pg_catalog.btrim(c.contact_name), ''), 'Professional') as contact_name,
      c.contact_role,
      null::text as business_name,
      null::text as avatar_url,
      null::text as job_title
    from public.get_direct_message_contacts() c
  ),
  conversations as (
    select * from application_conversations
    union all
    select * from direct_conversations
  )
  select
    c.conversation_kind,
    c.conversation_id,
    c.contact_id,
    c.contact_name,
    c.contact_role,
    c.business_name,
    c.avatar_url,
    c.job_title,
    latest.body as last_message,
    latest.created_at as last_message_at,
    coalesce(unread.total, 0)::bigint as unread_count
  from conversations c
  left join lateral (
    select m.body, m.created_at
    from public.messages m
    where c.conversation_kind = 'application'
      and m.application_id = c.conversation_id
    order by m.created_at desc
    limit 1
  ) latest_application on true
  left join lateral (
    select m.body, m.created_at
    from public.direct_messages m
    where c.conversation_kind = 'direct'
      and m.conversation_id = c.conversation_id
    order by m.created_at desc
    limit 1
  ) latest_direct on true
  left join lateral (
    select
      case
        when c.conversation_kind = 'application' then latest_application.body
        else latest_direct.body
      end as body,
      case
        when c.conversation_kind = 'application' then latest_application.created_at
        else latest_direct.created_at
      end as created_at
  ) latest on true
  left join lateral (
    select count(*) as total
    from public.messages m
    where c.conversation_kind = 'application'
      and m.application_id = c.conversation_id
      and m.recipient_id = (select auth.uid())
      and m.read_at is null
  ) unread_application on true
  left join lateral (
    select count(*) as total
    from public.direct_messages m
    where c.conversation_kind = 'direct'
      and m.conversation_id = c.conversation_id
      and m.recipient_id = (select auth.uid())
      and m.read_at is null
  ) unread_direct on true
  left join lateral (
    select case
      when c.conversation_kind = 'application' then unread_application.total
      else unread_direct.total
    end as total
  ) unread on true
  where (select auth.uid()) is not null
    and public.user_has_platform_access((select auth.uid()))
  order by latest.created_at desc nulls last;
$function$
;
revoke all on function public.get_message_conversation_summaries() from public, anon;
grant execute on function public.get_message_conversation_summaries() to authenticated;
