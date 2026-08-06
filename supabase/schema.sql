create table if not exists study_records (
  subject text not null,
  year integer not null,
  status text default '未着手',
  difficulty text default '',
  score text default '',
  formula text default '',
  memo text default '',
  updated_at timestamp with time zone default now(),
  primary key (subject, year)
);

create table if not exists submission_images (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  year integer not null,
  image_url text not null,
  file_path text not null,
  created_at timestamp with time zone default now()
);

create table if not exists custom_problems (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  title text not null,
  topic text default '',
  source text default '',
  status text default '未着手',
  importance text default '',
  short_memo text default '',
  memo text default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists problem_assets (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null,
  owner_id text not null,
  subject text not null,
  asset_type text default '問題',
  image_url text not null,
  file_path text not null,
  created_at timestamp with time zone default now()
);

create table if not exists consultation_logs (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null,
  owner_id text not null,
  subject text not null,
  title text default '',
  content text not null,
  created_at timestamp with time zone default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_study_records_updated_at on study_records;
drop trigger if exists set_custom_problems_updated_at on custom_problems;

create trigger set_study_records_updated_at
before update on study_records
for each row
execute function set_updated_at();

create trigger set_custom_problems_updated_at
before update on custom_problems
for each row
execute function set_updated_at();

alter table study_records enable row level security;
alter table submission_images enable row level security;
alter table custom_problems enable row level security;
alter table problem_assets enable row level security;
alter table consultation_logs enable row level security;

drop policy if exists "Allow public access study records" on study_records;
drop policy if exists "Allow public access submission images" on submission_images;
drop policy if exists "Allow public access custom problems" on custom_problems;
drop policy if exists "Allow public access problem assets" on problem_assets;
drop policy if exists "Allow public access consultation logs" on consultation_logs;

create policy "Allow public access study records"
on study_records
for all
to anon
using (true)
with check (true);

create policy "Allow public access submission images"
on submission_images
for all
to anon
using (true)
with check (true);

create policy "Allow public access custom problems"
on custom_problems
for all
to anon
using (true)
with check (true);

create policy "Allow public access problem assets"
on problem_assets
for all
to anon
using (true)
with check (true);

create policy "Allow public access consultation logs"
on consultation_logs
for all
to anon
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('study-assets', 'study-assets', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', true)
on conflict (id) do update set public = true;

drop policy if exists "Allow public read study assets" on storage.objects;
drop policy if exists "Allow public upload study assets" on storage.objects;
drop policy if exists "Allow public update study assets" on storage.objects;
drop policy if exists "Allow public delete study assets" on storage.objects;

create policy "Allow public read study assets"
on storage.objects
for select
to anon
using (bucket_id = 'study-assets');

create policy "Allow public upload study assets"
on storage.objects
for insert
to anon
with check (bucket_id = 'study-assets');

create policy "Allow public update study assets"
on storage.objects
for update
to anon
using (bucket_id = 'study-assets')
with check (bucket_id = 'study-assets');

create policy "Allow public delete study assets"
on storage.objects
for delete
to anon
using (bucket_id = 'study-assets');

drop policy if exists "Allow public read submissions" on storage.objects;
drop policy if exists "Allow public upload submissions" on storage.objects;
drop policy if exists "Allow public update submissions" on storage.objects;
drop policy if exists "Allow public delete submissions" on storage.objects;

create policy "Allow public read submissions"
on storage.objects
for select
to anon
using (bucket_id = 'submissions');

create policy "Allow public upload submissions"
on storage.objects
for insert
to anon
with check (bucket_id = 'submissions');

create policy "Allow public update submissions"
on storage.objects
for update
to anon
using (bucket_id = 'submissions')
with check (bucket_id = 'submissions');

create policy "Allow public delete submissions"
on storage.objects
for delete
to anon
using (bucket_id = 'submissions');
