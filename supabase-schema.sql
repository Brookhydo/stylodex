-- À exécuter dans Supabase : Project > SQL Editor > New query > Run

create table if not exists pens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  catalog_number integer not null,
  name text not null,
  brand text not null,
  ink_type text not null default 'plume',
  ink_color text default '',
  swatch_hex text default '#2F6F4F',
  nib_size text default '',
  acquired_date date,
  price numeric,
  rating integer default 0,
  status text default 'possede',
  favorite boolean default false,
  notes text default '',
  image_url text default '',
  created_at timestamptz default now()
);

alter table pens enable row level security;

create policy "Chacun voit ses propres stylos"
  on pens for select
  using (auth.uid() = user_id);

create policy "Chacun ajoute ses propres stylos"
  on pens for insert
  with check (auth.uid() = user_id);

create policy "Chacun modifie ses propres stylos"
  on pens for update
  using (auth.uid() = user_id);

create policy "Chacun supprime ses propres stylos"
  on pens for delete
  using (auth.uid() = user_id);

create index if not exists pens_user_id_idx on pens(user_id);
