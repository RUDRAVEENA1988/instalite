-- Run this in Supabase SQL Editor before using the app.
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null check (char_length(username) between 1 and 30),
  caption text not null check (char_length(caption) between 1 and 500),
  image_url text not null,
  image_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
alter table public.posts enable row level security;

drop policy if exists "Posts are publicly readable" on public.posts;
create policy "Posts are publicly readable" on public.posts for select using (true);
drop policy if exists "Users can create their own posts" on public.posts;
create policy "Users can create their own posts" on public.posts for insert
  with check ((select auth.uid()) = user_id);
drop policy if exists "Posts cannot be updated" on public.posts;
create policy "Posts cannot be updated" on public.posts for update using (false);
drop policy if exists "Posts cannot be deleted" on public.posts;
create policy "Posts cannot be deleted" on public.posts for delete using (false);

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Authenticated users can upload their own post images" on storage.objects;
create policy "Authenticated users can upload their own post images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = 'posts'
    and (storage.foldername(name))[2] = (select auth.uid()::text));
drop policy if exists "Anyone can read post images" on storage.objects;
create policy "Anyone can read post images" on storage.objects
  for select to public using (bucket_id = 'post-images');
drop policy if exists "Users can delete their own post images" on storage.objects;
create policy "Users can delete their own post images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = 'posts'
    and (storage.foldername(name))[2] = (select auth.uid()::text));

alter table public.posts replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end
$$;
