CREATE INDEX IF NOT EXISTS idx_career_events_created_by ON public.career_events(created_by);
CREATE INDEX IF NOT EXISTS idx_career_events_updated_by ON public.career_events(updated_by);
CREATE INDEX IF NOT EXISTS idx_community_comments_author_id ON public.community_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_community_content_reports_comment_id ON public.community_content_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_community_content_reports_post_id ON public.community_content_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_community_content_reports_reporter_id ON public.community_content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_community_content_reports_reviewed_by ON public.community_content_reports(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_community_posts_author_id ON public.community_posts(author_id);