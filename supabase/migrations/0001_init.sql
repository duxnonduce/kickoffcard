-- Kick Off — schema iniziale
create extension if not exists pgcrypto;

create table sports (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table admins (
  id uuid primary key default gen_random_uuid(),  -- = auth.users.id
  full_name text not null,
  created_at timestamptz not null default now()
);

create table receptionists (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references admins(id)
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id),
  first_name text not null,
  last_name text not null,
  codice_fiscale text not null unique,
  email text unique,
  phone text,
  created_at timestamptz not null default now(),
  created_by_type text not null check (created_by_type in ('admin','receptionist')),
  created_by_id uuid not null
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  barcode text not null unique,
  status text not null default 'disponibile' check (status in ('disponibile','associata')),
  client_id uuid references clients(id),
  batch_label text,
  activated_at timestamptz,
  activated_by_type text check (activated_by_type in ('admin','receptionist')),
  activated_by_id uuid,
  created_at timestamptz not null default now(),
  created_by uuid references admins(id)
);
create index on cards (client_id);

create table packages (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id),
  client_id uuid not null references clients(id),
  sport_id uuid not null references sports(id),
  total_entries int not null,
  remaining_entries int not null,
  price numeric(10,2) not null,
  expiry_date date,
  sold_at timestamptz not null default now(),
  sold_by_type text not null check (sold_by_type in ('admin','receptionist')),
  sold_by_id uuid not null,
  status text not null default 'active' check (status in ('active','exhausted','expired','cancelled'))
);
create index on packages (card_id, status);
create index on packages (client_id);

create table entry_logs (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references packages(id),
  card_id uuid not null references cards(id),
  client_id uuid not null references clients(id),
  entries_deducted int not null default 1,
  performed_by_type text not null check (performed_by_type in ('admin','receptionist')),
  performed_by_id uuid not null,
  performed_at timestamptz not null default now(),
  note text,
  reversed boolean not null default false,
  reversed_by_id uuid references admins(id),
  reversed_at timestamptz
);
create index on entry_logs (package_id);
create index on entry_logs (client_id);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null check (actor_type in ('admin','receptionist')),
  actor_id uuid not null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index on audit_log (entity_type, entity_id);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  package_id uuid references packages(id),
  type text not null check (type in ('acquisto','in_scadenza','scaduto')),
  sent_at timestamptz not null default now(),
  channel text not null default 'email'
);

-- Seed sport iniziali
insert into sports (name) values ('Padel'), ('Tennis'), ('Calcio a 5'), ('Beach Volley')
on conflict do nothing;

-- RLS: attiva su tabelle esposte a client/admin via Supabase Auth.
-- La reception NON passa da qui: le sue query passano da API routes con service role key
-- e controlli applicativi (vedi lib/auth/receptionSession.ts).
alter table clients enable row level security;
alter table cards enable row level security;
alter table packages enable row level security;
alter table entry_logs enable row level security;
alter table notifications enable row level security;

create policy "client reads own profile" on clients
  for select using (auth_user_id = auth.uid());

create policy "client reads own cards" on cards
  for select using (
    client_id in (select id from clients where auth_user_id = auth.uid())
  );

create policy "client reads own packages" on packages
  for select using (
    client_id in (select id from clients where auth_user_id = auth.uid())
  );

create policy "client reads own entry logs" on entry_logs
  for select using (
    client_id in (select id from clients where auth_user_id = auth.uid())
  );

create policy "client reads own notifications" on notifications
  for select using (
    client_id in (select id from clients where auth_user_id = auth.uid())
  );

-- Admin: accesso pieno tramite service role key lato server (bypassa RLS).
