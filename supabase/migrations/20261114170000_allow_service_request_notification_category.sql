-- Allow service request workflows to write their dedicated notification category.
-- These RPCs insert the notification in the same transaction as the request.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_category_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_category_check
  CHECK (
    category = ANY (
      ARRAY[
        'application'::text,
        'job'::text,
        'account'::text,
        'system'::text,
        'service_request'::text
      ]
    )
  );
