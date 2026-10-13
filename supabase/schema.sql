-- Run this in Supabase SQL Editor before using the app.
-- Supabase Auth stores email/password credentials in auth.users. The profiles
-- table stores the app-facing account details without duplicating passwords.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (char_length(username) between 1 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable" on public.profiles for select using (true);
drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile" on public.profiles for insert
  with check ((select auth.uid()) = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'instalite-user'), 30)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

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
alter publication supabase_realtime add table public.posts;
