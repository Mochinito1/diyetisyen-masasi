-- Diyetisyen Masası: Supabase şeması ve güvenlik kuralları (RLS)
-- Supabase paneli > SQL Editor'a yapıştırıp bir kez çalıştırın. Tekrar çalıştırmak güvenlidir.

-- ───────────── Tablolar ─────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9._-]{3,20}$'),
  ad text not null,
  kind text not null check (kind in ('admin', 'diyetisyen', 'danisan')),
  unvan text,
  -- boş = etkin hesap; diyetisyen başvurusu onaylanana kadar 'pending'
  status text check (status in ('pending', 'rejected')),
  client_id text,
  created timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  name text not null,
  title text not null,
  note text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  unvan text,
  created timestamptz not null default now()
);

create table if not exists public.clients (
  id text primary key,
  data jsonb not null,
  -- danışanın seçtiği diyetisyenin kullanıcı adı; boş = henüz seçmedi
  dietitian text not null default '',
  owner_user uuid references auth.users(id) on delete cascade,
  updated timestamptz not null default now()
);

create table if not exists public.appointments (
  id text primary key,
  client_id text not null,
  dietitian text not null default '',
  data jsonb not null,
  updated timestamptz not null default now()
);

create table if not exists public.settings (
  owner text not null,
  key text not null,
  value jsonb not null,
  updated timestamptz not null default now(),
  primary key (owner, key)
);

-- ───────────── Yardımcı fonksiyonlar ─────────────
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and kind = 'admin')
$$;

-- Etkin (onaylı) diyetisyenin kullanıcı adı; başvurusu bekleyen ve danışanlar için null
create or replace function public.my_username() returns text
language sql security definer stable set search_path = public as $$
  select username from public.profiles where id = auth.uid() and kind = 'diyetisyen' and status is null
$$;

create or replace function public.my_client_id() returns text
language sql security definer stable set search_path = public as $$
  select client_id from public.profiles where id = auth.uid() and kind = 'danisan'
$$;

-- ───────────── Güvenlik kuralları (RLS) ─────────────
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.settings enable row level security;

-- profiles: kendini, yönetici hepsini, herkes onaylı diyetisyenleri görür
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin() or (kind = 'diyetisyen' and status is null));

-- Kayıt: yalnızca kendi profilini, danışan olarak ya da bekleyen diyetisyen olarak açabilir (yönetici yapamaz)
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid() and (
    (kind = 'danisan' and status is null) or (kind = 'diyetisyen' and status = 'pending')
  ));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete to authenticated
  using (public.is_admin());

-- applications: başvuranlar yalnızca kendi adlarına 'pending' kayıt ekler; yönetici hepsini yönetir
drop policy if exists applications_select on public.applications;
create policy applications_select on public.applications for select to authenticated
  using (public.is_admin());

drop policy if exists applications_insert on public.applications;
create policy applications_insert on public.applications for insert to authenticated
  with check (
    status = 'pending'
    and username = (select username from public.profiles where id = auth.uid())
  );

drop policy if exists applications_update on public.applications;
create policy applications_update on public.applications for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists applications_delete on public.applications;
create policy applications_delete on public.applications for delete to authenticated
  using (public.is_admin());

-- clients: danışanı yalnızca kendisi, seçtiği diyetisyen ve yönetici görür / değiştirir
drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients for select to authenticated
  using (public.is_admin() or owner_user = auth.uid() or dietitian = public.my_username());

drop policy if exists clients_insert on public.clients;
create policy clients_insert on public.clients for insert to authenticated
  with check (
    public.is_admin()
    or dietitian = public.my_username()
    or (owner_user = auth.uid() and id = public.my_client_id())
  );

drop policy if exists clients_update on public.clients;
create policy clients_update on public.clients for update to authenticated
  using (public.is_admin() or owner_user = auth.uid() or dietitian = public.my_username())
  with check (
    public.is_admin()
    or dietitian = public.my_username()
    or (owner_user = auth.uid() and id = public.my_client_id())
  );

drop policy if exists clients_delete on public.clients;
create policy clients_delete on public.clients for delete to authenticated
  using (public.is_admin() or dietitian = public.my_username());

-- appointments: danışanın kendi randevuları, seçtiği diyetisyen ve yönetici
drop policy if exists appointments_all on public.appointments;
create policy appointments_all on public.appointments for all to authenticated
  using (
    public.is_admin()
    or (dietitian = public.my_username() and exists (
      select 1 from public.clients c where c.id = appointments.client_id and c.dietitian = public.my_username()))
    or exists (select 1 from public.clients c where c.id = appointments.client_id and c.owner_user = auth.uid())
  )
  with check (
    public.is_admin()
    or (dietitian = public.my_username() and exists (
      select 1 from public.clients c where c.id = appointments.client_id and c.dietitian = public.my_username()))
    or exists (
      select 1 from public.clients c
      where c.id = appointments.client_id and c.owner_user = auth.uid() and c.dietitian = appointments.dietitian)
  );

-- Danışanın boş saatleri görebilmesi için: yalnızca tarih/saat ve durum döner (isim, not, bağlantı yok).
-- Eski SECURITY DEFINER görünümü (appointment_slots) güvenlik taramasında kritik çıktığı için kaldırıldı;
-- yerine, yalnızca çağıranın kendi seçtiği diyetisyenin saatlerini veren (ya da diyetisyenin/yöneticinin kendi saatleri) fonksiyon var.
drop view if exists public.appointment_slots;
create or replace function public.appointment_slots(p_dietitian text)
returns table (id text, data jsonb)
language sql security definer stable set search_path = public as $$
  select a.id,
         jsonb_build_object('id', a.id, 'clientId', 'hidden', 'clientName', '', 'dt', a.data->>'dt',
                            'type', a.data->'type', 'link', '', 'note', '', 'status', a.data->>'status',
                            'by', 'diyetisyen', 'dietitian', a.dietitian, 'created', 0)
  from public.appointments a
  where a.dietitian = p_dietitian
    and p_dietitian <> ''
    and (
      public.is_admin()
      or p_dietitian = public.my_username()
      or exists (select 1 from public.clients c where c.owner_user = auth.uid() and c.dietitian = p_dietitian)
    )
$$;
revoke all on function public.appointment_slots(text) from public, anon;
grant execute on function public.appointment_slots(text) to authenticated;
-- settings: klinik bilgileri ve çalışma saatleri; herkes okur, yalnızca sahibi ve yönetici yazar
drop policy if exists settings_select on public.settings;
create policy settings_select on public.settings for select to authenticated using (true);

drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings for all to authenticated
  using (public.is_admin() or owner = public.my_username())
  with check (public.is_admin() or owner = public.my_username());

-- ───────────── Yönetici ve şifre fonksiyonları ─────────────
-- "Şifremi unuttum": kullanıcı adı ve ad soyad eşleşirse şifre yenilenir (eğitim sürümü; e-posta doğrulaması yok)
create or replace function public.reset_password(p_username text, p_ad text, p_pass text) returns boolean
language plpgsql security definer set search_path = public, auth, extensions as $$
declare uid uuid;
begin
  if p_pass is null or length(p_pass) < 8 then return false; end if;
  select id into uid from public.profiles
   where username = lower(trim(p_username)) and lower(ad) = lower(trim(p_ad)) and kind <> 'admin';
  if uid is null then return false; end if;
  update auth.users set encrypted_password = crypt(p_pass, gen_salt('bf')), updated_at = now() where id = uid;
  return true;
end $$;
revoke all on function public.reset_password(text, text, text) from public;
grant execute on function public.reset_password(text, text, text) to anon, authenticated;

-- Yönetici: hesabı (ve ona bağlı danışan kaydını) tamamen siler
create or replace function public.admin_delete_user(p_username text default null, p_client text default null) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'yetki yok'; end if;
  delete from auth.users where id in (
    select id from public.profiles
     where kind <> 'admin' and ((p_username is not null and username = p_username) or (p_client is not null and client_id = p_client))
  );
end $$;
revoke all on function public.admin_delete_user(text, text) from public;
grant execute on function public.admin_delete_user(text, text) to authenticated;

-- ───────────── Erişim yetkileri (Data API) ─────────────
-- "Automatically expose new tables" kapalıyken tablolara yetki elle verilir. Satır erişimini RLS kuralları sınırlar.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.applications, public.clients, public.appointments, public.settings to authenticated;
grant execute on function public.is_admin(), public.my_username(), public.my_client_id() to authenticated;