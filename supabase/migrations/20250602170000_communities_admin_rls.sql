-- 관리자(is_admin)가 타인 커뮤니티 글·연관 데이터를 삭제·수정할 수 있도록 RLS 정책 추가
-- (기존 "Users can delete own communities" 등과 OR 조건으로 함께 적용)

CREATE POLICY "communities_update_admin"
  ON public.communities
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "communities_delete_admin"
  ON public.communities
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- FK ON DELETE CASCADE 시 자식 행 삭제에도 RLS가 적용되므로 관리자 삭제 정책 추가
CREATE POLICY "community_comments_delete_admin"
  ON public.community_comments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "community_likes_delete_admin"
  ON public.community_likes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "community_bookmarks_delete_admin"
  ON public.community_bookmarks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "community_comment_likes_delete_admin"
  ON public.community_comment_likes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
