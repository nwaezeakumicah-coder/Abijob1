CREATE OR REPLACE FUNCTION public.get_message_conversation_summaries()
RETURNS TABLE(conversation_kind text, conversation_id uuid, contact_id uuid, contact_name text, contact_role text, business_name text, avatar_url text, job_title text, last_message text, last_message_at timestamptz, unread_count bigint)
LANGUAGE sql STABLE SET search_path TO ''
AS $function$
  WITH application_conversations AS (
    SELECT 'application'::text, c.application_id, c.contact_id,
      CASE WHEN c.contact_role = 'applicant'
        THEN COALESCE(NULLIF(pg_catalog.btrim(c.contact_name), ''), 'Applicant')
        ELSE COALESCE(NULLIF(pg_catalog.btrim(c.business_name), ''), NULLIF(pg_catalog.btrim(c.contact_name), ''), 'Employer') END,
      c.contact_role, c.business_name, c.avatar_url, c.job_title
    FROM public.get_message_contacts() c
  ),
  direct_conversations AS (
    SELECT 'direct'::text, c.conversation_id, c.contact_id,
      COALESCE(NULLIF(pg_catalog.btrim(c.contact_name), ''), 'Professional'),
      c.contact_role, NULL::text, c.avatar_url, NULL::text
    FROM public.get_direct_message_contacts() c
  ),
  conversations AS (
    SELECT * FROM application_conversations UNION ALL SELECT * FROM direct_conversations
  )
  SELECT c.conversation_kind, c.conversation_id, c.contact_id, c.contact_name,
    c.contact_role, c.business_name, c.avatar_url, c.job_title,
    latest.body, latest.created_at, COALESCE(unread.total, 0)::bigint
  FROM conversations c
  LEFT JOIN LATERAL (
    SELECT CASE WHEN c.conversation_kind = 'application' THEN ma.body ELSE dm.body END AS body,
      CASE WHEN c.conversation_kind = 'application' THEN ma.created_at ELSE dm.created_at END AS created_at
    FROM (SELECT m.body, m.created_at FROM public.messages m WHERE m.application_id = c.conversation_id ORDER BY m.created_at DESC LIMIT 1) ma
    FULL JOIN (SELECT m.body, m.created_at FROM public.direct_messages m WHERE m.conversation_id = c.conversation_id ORDER BY m.created_at DESC LIMIT 1) dm ON true
  ) latest ON true
  LEFT JOIN LATERAL (
    SELECT CASE WHEN c.conversation_kind = 'application' THEN ua.total ELSE ud.total END AS total
    FROM (SELECT count(*) AS total FROM public.messages m WHERE m.application_id = c.conversation_id AND m.recipient_id = (SELECT auth.uid()) AND m.read_at IS NULL) ua
    CROSS JOIN (SELECT count(*) AS total FROM public.direct_messages m WHERE m.conversation_id = c.conversation_id AND m.recipient_id = (SELECT auth.uid()) AND m.read_at IS NULL) ud
  ) unread ON true
  WHERE (SELECT auth.uid()) IS NOT NULL AND public.user_has_platform_access((SELECT auth.uid()))
  ORDER BY latest.created_at DESC NULLS LAST;
$function$;