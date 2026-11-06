-- 스터디플래너 동기화용 테이블
-- Supabase 대시보드 > SQL Editor > New query 에 전체를 붙여 넣고 Run 을 누르세요.

create table if not exists public.planner_docs (
  user_id    uuid    not null references auth.users(id) on delete cascade,
  doc_id     text    not null,           -- 'meta' 또는 'p-<페이지 id>'
  data       jsonb,
  deleted    boolean not null default false,
  updated_at bigint  not null,           -- 마지막으로 고친 시각 (밀리초)
  primary key (user_id, doc_id)
);

alter table public.planner_docs enable row level security;

-- 내 행만 읽고 쓸 수 있게 한다. 다른 사람의 일정은 볼 수 없다.
create policy "planner_select_own" on public.planner_docs
  for select to authenticated using (auth.uid() = user_id);
create policy "planner_insert_own" on public.planner_docs
  for insert to authenticated with check (auth.uid() = user_id);
create policy "planner_update_own" on public.planner_docs
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "planner_delete_own" on public.planner_docs
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.planner_docs to authenticated;
