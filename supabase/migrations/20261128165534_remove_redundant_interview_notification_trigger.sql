-- Candidate invitation, reschedule and cancellation notifications are
-- already emitted by notify_applicant_on_interview_change(). Candidate
-- acceptance/decline notifications are emitted atomically by respond_to_interview().
-- The legacy participant trigger duplicated both flows and is no longer needed.
drop trigger if exists trg_notify_interview_participants on public.interviews;

revoke all on function public.notify_interview_participants()
  from public, anon, authenticated;

-- The employer interview page now relies on database triggers for invitation,
-- schedule and cancellation events; prevent clients from manually replaying
-- arbitrary notification events for an existing interview.
revoke all on function public.notify_interview_participant(uuid,text)
  from public, anon, authenticated;
