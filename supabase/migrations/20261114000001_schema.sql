-- الحاويات: الجداول وسياسات الخصوصية (RLS) والدوال.
-- القاعدة: صفر إحراج. حالة دفع أي عضو يقرأها هو نفسه، ومنشئ القطة، ومسؤول الصندوق للقطة الشهرية فقط.
-- كل جدول عليه RLS. الدوال الداخلية في مخطط private (مو مكشوف للـ API).

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

-- ───────────── الأنواع ─────────────
create type public.member_role as enum ('member', 'fund_manager');
create type public.contribution_kind as enum ('monthly', 'event');
create type public.contribution_status as enum ('open', 'closed');
create type public.expense_category as enum ('firewood', 'food', 'gas', 'maintenance', 'other');
create type public.session_kind as enum ('arrived', 'going');
create type public.treat_kind as enum ('tea', 'coffee', 'dinner', 'bbq');
create type public.reply_kind as enum ('coming', 'soon', 'dinner', 'cant');
create type public.presence_source as enum ('button', 'geofence');
create type public.notif_type as enum ('monthly_due', 'monthly_reminder', 'event_qatta', 'arrival', 'treat', 'settlement');
create type public.notif_frequency as enum ('daily', 'every2', 'weekly');

-- ───────────── الجداول ─────────────
create table public.camps (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  invite_code text not null unique,
  monthly_amount numeric(10, 2) not null default 300 check (monthly_amount > 0),
  monthly_due_day int not null default 10 check (monthly_due_day between 1 and 28),
  center_lat double precision,
  center_lng double precision,
  radius_m int not null default 150 check (radius_m between 50 and 2000),
  timezone text not null default 'Asia/Riyadh',
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_url text,
  role public.member_role not null default 'member',
  geofence_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  unique (camp_id, user_id)
);
create index on public.members (user_id);

-- إعدادات شخصية: ما يقرأها إلا صاحبها
create table public.member_settings (
  member_id uuid primary key references public.members (id) on delete cascade,
  notifications_enabled boolean not null default true,
  quiet_enabled boolean not null default true,
  quiet_start time not null default '00:00',
  quiet_end time not null default '07:00'
);

create table public.push_tokens (
  member_id uuid not null references public.members (id) on delete cascade,
  token text not null check (token like 'ExponentPushToken[%' or token like 'ExpoPushToken[%'),
  updated_at timestamptz not null default now(),
  primary key (member_id, token)
);

create table public.notification_prefs (
  member_id uuid not null references public.members (id) on delete cascade,
  type public.notif_type not null,
  enabled boolean not null default true,
  frequency public.notif_frequency,
  only_member_ids uuid[],
  primary key (member_id, type)
);

create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps (id) on delete cascade,
  kind public.contribution_kind not null,
  title text not null check (char_length(title) between 1 and 60),
  amount_per_person numeric(10, 2) not null check (amount_per_person > 0),
  total_amount numeric(10, 2),
  created_by uuid references public.members (id) on delete set null, -- null للشهرية (ينشئها النظام)
  due_date date not null,
  period text check (period ~ '^\d{4}-\d{2}$'),
  status public.contribution_status not null default 'open',
  created_at timestamptz not null default now(),
  check ((kind = 'monthly') = (period is not null))
);
create unique index contributions_monthly_period on public.contributions (camp_id, period) where kind = 'monthly';

-- هنا الخصوصية: كل صف حالة دفع شخص واحد
create table public.contribution_participants (
  contribution_id uuid not null references public.contributions (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  paid_at timestamptz,
  receipt_url text,
  last_reminded_at timestamptz,
  primary key (contribution_id, member_id)
);
create index on public.contribution_participants (member_id);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps (id) on delete cascade,
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  created_at timestamptz not null default now(),
  unique (camp_id, period)
);

create table public.settlement_items (
  id uuid primary key default gen_random_uuid(),
  settlement_id uuid not null references public.settlements (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  amount numeric(10, 2) not null,
  settled_at timestamptz,
  unique (settlement_id, member_id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps (id) on delete cascade,
  paid_by uuid not null references public.members (id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  category public.expense_category not null,
  description text check (char_length(description) <= 80),
  receipt_url text,
  spent_at date not null default current_date,
  settlement_item_id uuid references public.settlement_items (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.expenses (camp_id, spent_at desc);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps (id) on delete cascade,
  started_by uuid not null references public.members (id) on delete cascade, -- مين بادر (أول من فتح الجلسة)
  host_id uuid references public.members (id) on delete set null, -- صاحب العزيمة لو فيه
  kind public.session_kind not null,
  treat public.treat_kind,
  at_time timestamptz,
  message text check (char_length(message) <= 140),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);
create index on public.sessions (camp_id, created_at desc);

create table public.session_responses (
  session_id uuid not null references public.sessions (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  response public.reply_kind not null,
  responded_at timestamptz not null default now(),
  primary key (session_id, member_id)
);

create table public.presence (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  camp_id uuid not null references public.camps (id) on delete cascade,
  arrived_at timestamptz not null default now(),
  left_at timestamptz,
  source public.presence_source not null default 'button'
);
create unique index presence_one_open on public.presence (member_id) where left_at is null;
create index on public.presence (camp_id, arrived_at desc);

-- طابور الإشعارات: ما يوصله التطبيق أبدًا (بدون سياسات = مقفول)
create table public.notification_queue (
  id bigint generated always as identity primary key,
  member_id uuid not null references public.members (id) on delete cascade,
  type public.notif_type not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}',
  category text,
  send_after timestamptz not null default now(),
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
create index on public.notification_queue (send_after) where sent_at is null;

-- ───────────── دوال مساعدة (داخلية) ─────────────
create or replace function private.my_member_id(p_camp uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select m.id from public.members m where m.camp_id = p_camp and m.user_id = (select auth.uid());
$$;

create or replace function private.my_member_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select m.id from public.members m where m.user_id = (select auth.uid());
$$;

create or replace function private.is_camp_member(p_camp uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.members m where m.camp_id = p_camp and m.user_id = (select auth.uid()));
$$;

create or replace function private.is_fund_manager(p_camp uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.members m
    where m.camp_id = p_camp and m.user_id = (select auth.uid()) and m.role = 'fund_manager'
  );
$$;

-- يشوف كل صفوف القطة: منشئ قطة المناسبة، أو مسؤول الصندوق للشهرية
create or replace function private.can_see_all_rows(p_contribution uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.contributions c
    where c.id = p_contribution
      and (
        (c.kind = 'event' and c.created_by in (select private.my_member_ids()))
        or (c.kind = 'monthly' and private.is_fund_manager(c.camp_id))
      )
  );
$$;

create or replace function private.is_participant(p_contribution uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.contribution_participants p
    where p.contribution_id = p_contribution and p.member_id in (select private.my_member_ids())
  );
$$;

grant usage on schema private to authenticated;
revoke execute on all functions in schema private from public;
grant execute on function private.my_member_id(uuid), private.my_member_ids(), private.is_camp_member(uuid),
  private.is_fund_manager(uuid), private.can_see_all_rows(uuid), private.is_participant(uuid) to authenticated;

-- ───────────── RLS ─────────────
alter table public.camps enable row level security;
alter table public.members enable row level security;
alter table public.member_settings enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.contributions enable row level security;
alter table public.contribution_participants enable row level security;
alter table public.settlements enable row level security;
alter table public.settlement_items enable row level security;
alter table public.expenses enable row level security;
alter table public.sessions enable row level security;
alter table public.session_responses enable row level security;
alter table public.presence enable row level security;
alter table public.notification_queue enable row level security;

-- نبدأ من صفر صلاحيات ونعطي بالضبط اللي نحتاجه
revoke all on all tables in schema public from anon, authenticated;

-- المخيم: الأعضاء يقرون كل شي إلا كود الدعوة (له دالة خاصة بمسؤول الصندوق)
grant select (id, name, monthly_amount, monthly_due_day, center_lat, center_lng, radius_m, timezone, created_at)
  on public.camps to authenticated;
create policy camps_select on public.camps for select to authenticated using (private.is_camp_member(id));

-- الأعضاء: يشوفون بعض (الاسم والصورة والدور)، وكل واحد يعدل اسمه وصورته
grant select on public.members to authenticated;
grant update (display_name, avatar_url, geofence_enabled) on public.members to authenticated;
create policy members_select on public.members for select to authenticated using (private.is_camp_member(camp_id));
create policy members_update_self on public.members for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- الإعدادات الشخصية ورموز الإشعارات والتفضيلات: صاحبها فقط
grant select, insert, update, delete on public.member_settings, public.push_tokens, public.notification_prefs to authenticated;
create policy own_settings on public.member_settings for all to authenticated
  using (member_id in (select private.my_member_ids())) with check (member_id in (select private.my_member_ids()));
create policy own_tokens on public.push_tokens for all to authenticated
  using (member_id in (select private.my_member_ids())) with check (member_id in (select private.my_member_ids()));
create policy own_prefs on public.notification_prefs for all to authenticated
  using (member_id in (select private.my_member_ids())) with check (member_id in (select private.my_member_ids()));

-- القطط: الشهرية يشوفها كل الأعضاء. قطة المناسبة يشوفها منشئها والمشمولين فيها فقط.
grant select on public.contributions to authenticated;
create policy contributions_select on public.contributions for select to authenticated using (
  private.is_camp_member(camp_id)
  and (kind = 'monthly' or created_by in (select private.my_member_ids()) or private.is_participant(id))
);

-- صفوف الدفع: صاحب الصف، أو اللي يحق له يشوف الكل. لا أحد يعدّل مباشرة (عن طريق set_my_payment فقط).
grant select on public.contribution_participants to authenticated;
create policy participants_select on public.contribution_participants for select to authenticated using (
  member_id in (select private.my_member_ids()) or private.can_see_all_rows(contribution_id)
);

-- المصاريف: الكل يشوف (شفافية الصندوق). كل واحد يضيف ويعدّل ويحذف مصاريفه اللي ما تسوّت.
grant select, delete on public.expenses to authenticated;
grant insert (camp_id, paid_by, amount, category, description, receipt_url, spent_at) on public.expenses to authenticated;
grant update (amount, category, description, receipt_url, spent_at) on public.expenses to authenticated;
create policy expenses_select on public.expenses for select to authenticated using (private.is_camp_member(camp_id));
create policy expenses_insert on public.expenses for insert to authenticated
  with check (paid_by = private.my_member_id(camp_id) and settlement_item_id is null);
create policy expenses_update on public.expenses for update to authenticated
  using (paid_by in (select private.my_member_ids()) and settlement_item_id is null)
  with check (paid_by in (select private.my_member_ids()) and settlement_item_id is null);
create policy expenses_delete on public.expenses for delete to authenticated
  using (paid_by in (select private.my_member_ids()) and settlement_item_id is null);

-- التسوية: كل واحد يشوف بنده، ومسؤول الصندوق يشوف الكل
grant select on public.settlements, public.settlement_items to authenticated;
create policy settlements_select on public.settlements for select to authenticated using (private.is_camp_member(camp_id));
create policy settlement_items_select on public.settlement_items for select to authenticated using (
  member_id in (select private.my_member_ids())
  or exists (select 1 from public.settlements s where s.id = settlement_id and private.is_fund_manager(s.camp_id))
);

-- الجلسات والردود والحضور: يشوفها كل الأعضاء، والكتابة عن طريق الدوال
grant select on public.sessions, public.session_responses, public.presence to authenticated;
create policy sessions_select on public.sessions for select to authenticated using (private.is_camp_member(camp_id));
create policy responses_select on public.session_responses for select to authenticated using (
  exists (select 1 from public.sessions s where s.id = session_id and private.is_camp_member(s.camp_id))
);
create policy presence_select on public.presence for select to authenticated using (private.is_camp_member(camp_id));

-- notification_queue: بدون صلاحيات ولا سياسات = مقفول على التطبيق.

-- ───────────── الإشعارات (داخلي) ─────────────

-- وقت الإرسال مع احترام أوقات الهدوء (بتوقيت المخيم)
create or replace function private.send_time(p_member uuid, p_at timestamptz default now())
returns timestamptz language plpgsql stable security definer set search_path = '' as $$
declare
  s public.member_settings;
  tz text;
  local_ts timestamp;
  t time;
  quiet boolean;
  end_ts timestamp;
begin
  select * into s from public.member_settings where member_id = p_member;
  if not found or not s.quiet_enabled or s.quiet_start = s.quiet_end then
    return p_at;
  end if;
  select c.timezone into tz from public.members m join public.camps c on c.id = m.camp_id where m.id = p_member;
  local_ts := p_at at time zone tz;
  t := local_ts::time;
  if s.quiet_start < s.quiet_end then
    quiet := t >= s.quiet_start and t < s.quiet_end;
  else
    quiet := t >= s.quiet_start or t < s.quiet_end;
  end if;
  if not quiet then
    return p_at;
  end if;
  end_ts := local_ts::date + s.quiet_end;
  if end_ts <= local_ts then
    end_ts := end_ts + interval '1 day';
  end if;
  return end_ts at time zone tz;
end;
$$;

-- يضيف إشعار للطابور لو المستقبِل مفعّل هذا النوع. p_from: صاحب الحدث (لفلتر «أشخاص محددين»).
create or replace function private.notify(
  p_member uuid, p_type public.notif_type, p_title text, p_body text,
  p_data jsonb default '{}', p_category text default null, p_from uuid default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  s public.member_settings;
  pref public.notification_prefs;
begin
  select * into s from public.member_settings where member_id = p_member;
  if found and not s.notifications_enabled then
    return;
  end if;
  select * into pref from public.notification_prefs where member_id = p_member and type = p_type;
  if found then
    if not pref.enabled then
      return;
    end if;
    if p_from is not null and pref.only_member_ids is not null and cardinality(pref.only_member_ids) > 0
       and not (p_from = any (pref.only_member_ids)) then
      return;
    end if;
  elsif p_type = 'settlement' then
    return; -- التسوية مطفية افتراضيًا
  end if;
  insert into public.notification_queue (member_id, type, title, body, data, category, send_after)
  values (p_member, p_type, p_title, p_body, coalesce(p_data, '{}'), p_category, private.send_time(p_member));
end;
$$;

create or replace function private.ar_weekday(d date)
returns text language sql immutable as $$
  select (array['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'])[extract(dow from d)::int + 1];
$$;

create or replace function private.ar_month(m int)
returns text language sql immutable as $$
  select (array['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'])[m];
$$;

create or replace function private.money(n numeric)
returns text language sql immutable as $$
  select trim(to_char(n, 'FM999,999,990.##'), '.') || ' ريال';
$$;

-- نص التذكير المحايد: بدون اسم أي شخص، بدون «متأخر»، بدون علامات تعجب
create or replace function private.reminder_text(p_contribution uuid)
returns text language sql stable security definer set search_path = '' as $$
  select 'تذكير: ' || c.title || ' ' || private.money(c.amount_per_person) || '، تستحق ' ||
    case when c.due_date = (now() at time zone cp.timezone)::date then 'اليوم'
         else private.ar_weekday(c.due_date) || ' ' || extract(day from c.due_date)::int || ' ' || private.ar_month(extract(month from c.due_date)::int)
    end
  from public.contributions c join public.camps cp on cp.id = c.camp_id where c.id = p_contribution;
$$;

revoke execute on all functions in schema private from public;

-- ───────────── الدوال المكشوفة للتطبيق (RPC) ─────────────

-- إنشاء المخيم: أول واحد يصير مسؤول الصندوق
create or replace function public.create_camp(p_name text, p_display_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_camp uuid;
  v_member uuid;
begin
  if (select auth.uid()) is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from public.members where user_id = (select auth.uid())) then
    raise exception 'already_member';
  end if;
  insert into public.camps (name, invite_code)
  values (trim(p_name), upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 6)))
  returning id into v_camp;
  insert into public.members (camp_id, user_id, display_name, role)
  values (v_camp, (select auth.uid()), trim(p_display_name), 'fund_manager') returning id into v_member;
  insert into public.member_settings (member_id) values (v_member);
  return v_camp;
end;
$$;

-- الانضمام بكود الدعوة
create or replace function public.join_camp(p_code text, p_display_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_camp uuid;
  v_member uuid;
begin
  if (select auth.uid()) is null then raise exception 'not_authenticated'; end if;
  select id into v_camp from public.camps where invite_code = upper(trim(p_code));
  if v_camp is null then raise exception 'invalid_code'; end if;
  select id into v_member from public.members where camp_id = v_camp and user_id = (select auth.uid());
  if v_member is not null then return v_camp; end if;
  insert into public.members (camp_id, user_id, display_name)
  values (v_camp, (select auth.uid()), trim(p_display_name)) returning id into v_member;
  insert into public.member_settings (member_id) values (v_member);
  return v_camp;
end;
$$;

create or replace function public.get_invite_code(p_camp uuid)
returns text language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_fund_manager(p_camp) then raise exception 'forbidden'; end if;
  return (select invite_code from public.camps where id = p_camp);
end;
$$;

create or replace function public.regenerate_invite_code(p_camp uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare v text;
begin
  if not private.is_fund_manager(p_camp) then raise exception 'forbidden'; end if;
  v := upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 6));
  update public.camps set invite_code = v where id = p_camp;
  return v;
end;
$$;

create or replace function public.update_camp(
  p_camp uuid, p_monthly_amount numeric default null, p_monthly_due_day int default null,
  p_center_lat double precision default null, p_center_lng double precision default null, p_radius_m int default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_fund_manager(p_camp) then raise exception 'forbidden'; end if;
  update public.camps set
    monthly_amount = coalesce(p_monthly_amount, monthly_amount),
    monthly_due_day = coalesce(p_monthly_due_day, monthly_due_day),
    center_lat = coalesce(p_center_lat, center_lat),
    center_lng = coalesce(p_center_lng, center_lng),
    radius_m = coalesce(p_radius_m, radius_m)
  where id = p_camp;
end;
$$;

-- مسؤول الصندوق ينقل المسؤولية لعضو ثاني
create or replace function public.transfer_fund_manager(p_member uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_camp uuid;
begin
  select camp_id into v_camp from public.members where id = p_member;
  if v_camp is null or not private.is_fund_manager(v_camp) then raise exception 'forbidden'; end if;
  update public.members set role = 'member' where camp_id = v_camp and role = 'fund_manager';
  update public.members set role = 'fund_manager' where id = p_member;
end;
$$;

-- «دفعت» و«تراجعت»: صاحب الصف فقط، فورًا وبدون تأكيد من أحد
create or replace function public.set_my_payment(p_contribution uuid, p_paid boolean, p_receipt_url text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  update public.contribution_participants
     set paid_at = case when p_paid then now() else null end,
         receipt_url = case when p_paid then coalesce(p_receipt_url, receipt_url) else null end
   where contribution_id = p_contribution
     and member_id in (select private.my_member_ids());
  get diagnostics n = row_count;
  if n = 0 then raise exception 'not_participant'; end if;
end;
$$;

-- إنشاء قطة مناسبة. المنشئ ما يدفع لنفسه، فما ينضاف له صف.
-- p_mode: 'per' مبلغ لكل شخص، 'total' مبلغ كامل يتقسم بالتساوي (p_include_me: المنشئ داخل في القسمة)
create or replace function public.create_event_contribution(
  p_camp uuid, p_title text, p_mode text, p_amount numeric, p_member_ids uuid[], p_due_date date, p_include_me boolean default true
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := private.my_member_id(p_camp);
  v_others uuid[];
  v_per numeric;
  v_id uuid;
  v_name text;
  m uuid;
begin
  if v_me is null then raise exception 'forbidden'; end if;
  select array_agg(distinct x) into v_others
    from unnest(p_member_ids) x
   where x <> v_me and exists (select 1 from public.members where id = x and camp_id = p_camp);
  if v_others is null or cardinality(v_others) = 0 then raise exception 'no_participants'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount'; end if;
  if p_mode = 'total' then
    v_per := round(p_amount / (cardinality(v_others) + case when p_include_me then 1 else 0 end), 2);
  else
    v_per := p_amount;
  end if;
  insert into public.contributions (camp_id, kind, title, amount_per_person, total_amount, created_by, due_date)
  values (p_camp, 'event', trim(p_title), v_per, case when p_mode = 'total' then p_amount end, v_me, p_due_date)
  returning id into v_id;
  insert into public.contribution_participants (contribution_id, member_id) select v_id, unnest(v_others);
  select display_name into v_name from public.members where id = v_me;
  foreach m in array v_others loop
    perform private.notify(m, 'event_qatta', 'قطة جديدة: ' || trim(p_title),
      v_name || ' سوّى قطة، نصيبك ' || private.money(v_per),
      jsonb_build_object('url', '/qatta/' || v_id));
  end loop;
  return v_id;
end;
$$;

-- «ذكّر اللي ما دفعوا»: يوصل من التطبيق بدون اسم اللي ضغط
create or replace function public.remind_unpaid(p_contribution uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  c public.contributions;
  r record;
  v_text text;
begin
  select * into c from public.contributions where id = p_contribution;
  if c.id is null or not private.can_see_all_rows(p_contribution) then raise exception 'forbidden'; end if;
  if c.status <> 'open' then return; end if;
  v_text := private.reminder_text(p_contribution);
  for r in
    select member_id from public.contribution_participants
     where contribution_id = p_contribution and paid_at is null
       and (last_reminded_at is null or last_reminded_at < now() - interval '12 hours')
  loop
    perform private.notify(r.member_id,
      case when c.kind = 'monthly' then 'monthly_reminder'::public.notif_type else 'event_qatta'::public.notif_type end,
      'تذكير', v_text, jsonb_build_object('url', case when c.kind = 'monthly' then '/qatta' else '/qatta/' || c.id end));
    update public.contribution_participants set last_reminded_at = now()
     where contribution_id = p_contribution and member_id = r.member_id;
  end loop;
end;
$$;

create or replace function public.close_contribution(p_contribution uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.can_see_all_rows(p_contribution) then raise exception 'forbidden'; end if;
  update public.contributions set status = 'closed' where id = p_contribution;
end;
$$;

-- ───── الجلسة والحضور ─────
create or replace function private.active_session(p_camp uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.sessions
   where camp_id = p_camp and ended_at is null and created_at > now() - interval '12 hours'
   order by created_at desc limit 1;
$$;

-- «وصلت المخيم» / «رايح الحين»: أول ضغطة تفتح جلسة، والواصلين بعدها ينضمون لها.
-- العزيمة تنحط على الجلسة الحالية لو ما فيها عزيمة، وإلا تفتح جلسة جديدة.
create or replace function public.announce(
  p_camp uuid, p_kind public.session_kind, p_treat public.treat_kind default null,
  p_at_time timestamptz default null, p_message text default null, p_source public.presence_source default 'button'
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := private.my_member_id(p_camp);
  v_msg text := nullif(trim(p_message), '');
  v_name text;
  s public.sessions;
  v_title text;
  treat_ar text;
  r record;
begin
  if v_me is null then raise exception 'forbidden'; end if;

  select * into s from public.sessions where id = private.active_session(p_camp);
  if s.id is null or (p_treat is not null and s.treat is not null and s.host_id is distinct from v_me) then
    insert into public.sessions (camp_id, started_by, host_id, kind, treat, at_time, message)
    values (p_camp, v_me, case when p_treat is not null then v_me end, p_kind, p_treat, p_at_time, v_msg)
    returning * into s;
  elsif p_treat is not null then
    update public.sessions
       set treat = p_treat, host_id = v_me, at_time = p_at_time, message = coalesce(v_msg, message)
     where id = s.id;
  end if;

  if p_kind = 'arrived' then
    insert into public.presence (member_id, camp_id, source) values (v_me, p_camp, p_source)
    on conflict (member_id) where left_at is null do nothing;
  end if;

  select display_name into v_name from public.members where id = v_me;
  treat_ar := case p_treat when 'tea' then 'شاهي' when 'coffee' then 'قهوة' when 'dinner' then 'عشاء' when 'bbq' then 'شوي' end;
  v_title := v_name || case when p_kind = 'arrived' then ' وصل المخيم' else ' رايح المخيم' end
             || coalesce(' · عازمكم على ' || treat_ar, '');

  for r in select id from public.members where camp_id = p_camp and id <> v_me loop
    perform private.notify(r.id,
      case when p_treat is not null then 'treat'::public.notif_type else 'arrival'::public.notif_type end,
      v_title, coalesce(v_msg, case when treat_ar is not null then 'تعالوا' else 'المخيم فيه ناس' end),
      jsonb_build_object('url', '/session', 'session_id', s.id, 'treat', p_treat),
      case when p_treat = 'dinner' then 'invite_dinner' else 'invite' end,
      v_me);
  end loop;
  return s.id;
end;
$$;

-- الرد على الدعوة. «معكم بالعشاء» تنقبل بس لو الدعوة فيها عشاء.
create or replace function public.respond(p_session uuid, p_response public.reply_kind)
returns void language plpgsql security definer set search_path = '' as $$
declare
  s public.sessions;
  v_me uuid;
begin
  select * into s from public.sessions where id = p_session;
  v_me := private.my_member_id(s.camp_id);
  if v_me is null then raise exception 'forbidden'; end if;
  if p_response = 'dinner' and s.treat is distinct from 'dinner' then raise exception 'no_dinner'; end if;
  insert into public.session_responses (session_id, member_id, response) values (p_session, v_me, p_response)
  on conflict (session_id, member_id) do update set response = excluded.response, responded_at = now();
end;
$$;

-- طلعت من المخيم. لو آخر واحد طلع، تنتهي الجلسة.
create or replace function public.leave_camp(p_camp uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_me uuid := private.my_member_id(p_camp);
begin
  if v_me is null then raise exception 'forbidden'; end if;
  update public.presence set left_at = now() where member_id = v_me and left_at is null;
  if not exists (select 1 from public.presence where camp_id = p_camp and left_at is null) then
    update public.sessions set ended_at = now() where camp_id = p_camp and ended_at is null;
  end if;
end;
$$;

-- حدث الموقع التلقائي: دخل/طلع من حدود المخيم فقط (ما نحفظ الموقع نفسه)
create or replace function public.geofence_event(p_camp uuid, p_entered boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_me uuid := private.my_member_id(p_camp);
begin
  if v_me is null then raise exception 'forbidden'; end if;
  if not (select geofence_enabled from public.members where id = v_me) then return; end if;
  if p_entered then
    if not exists (select 1 from public.presence where member_id = v_me and left_at is null) then
      perform public.announce(p_camp, 'arrived', null, null, null, 'geofence');
    end if;
  else
    perform public.leave_camp(p_camp);
  end if;
end;
$$;

-- ───── الحساب والتسوية ─────
-- أرقام مجمّعة فقط، ما تكشف صفوف غيرك
create or replace function public.account_summary(p_camp uuid)
returns table (spent_this_month numeric, owed_to_me numeric, fund_balance numeric, settlement_date date)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_me uuid := private.my_member_id(p_camp);
  tz text;
  today date;
begin
  if v_me is null then raise exception 'forbidden'; end if;
  select timezone into tz from public.camps where id = p_camp;
  today := (now() at time zone tz)::date;
  return query select
    coalesce((select sum(amount) from public.expenses
               where paid_by = v_me and date_trunc('month', spent_at) = date_trunc('month', today)), 0)::numeric,
    coalesce((select sum(e.amount) from public.expenses e
               left join public.settlement_items si on si.id = e.settlement_item_id
               where e.paid_by = v_me and (e.settlement_item_id is null or si.settled_at is null)), 0)::numeric,
    (coalesce((select sum(c.amount_per_person) from public.contribution_participants p
                 join public.contributions c on c.id = p.contribution_id
                where c.camp_id = p_camp and c.kind = 'monthly' and p.paid_at is not null), 0)
     - coalesce((select sum(e.amount) from public.expenses e
                   join public.settlement_items si on si.id = e.settlement_item_id
                  where e.camp_id = p_camp and si.settled_at is not null), 0))::numeric,
    least((date_trunc('month', today) + interval '1 month' - interval '1 day')::date,
          (date_trunc('month', today) + interval '29 days')::date);
end;
$$;

-- ملخص التسوية: لكل عضو كم يستحق من الصندوق (مسؤول الصندوق)
create or replace function public.create_settlement(p_camp uuid, p_period text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_period text;
  v_id uuid;
  r record;
  v_item uuid;
begin
  if not private.is_fund_manager(p_camp) then raise exception 'forbidden'; end if;
  v_period := coalesce(p_period, to_char(now() at time zone (select timezone from public.camps where id = p_camp), 'YYYY-MM'));
  insert into public.settlements (camp_id, period) values (p_camp, v_period)
  on conflict (camp_id, period) do update set period = excluded.period
  returning id into v_id;
  for r in
    select paid_by, sum(amount) as total from public.expenses
     where camp_id = p_camp and settlement_item_id is null group by paid_by
  loop
    insert into public.settlement_items (settlement_id, member_id, amount) values (v_id, r.paid_by, r.total)
    on conflict (settlement_id, member_id) do update set amount = public.settlement_items.amount + excluded.amount
    returning id into v_item;
    update public.expenses set settlement_item_id = v_item
     where camp_id = p_camp and paid_by = r.paid_by and settlement_item_id is null;
    perform private.notify(r.paid_by, 'settlement', 'تسوية نهاية الشهر',
      'لك ' || private.money(r.total) || ' من الصندوق', jsonb_build_object('url', '/expenses'));
  end loop;
  return v_id;
end;
$$;

create or replace function public.mark_settled(p_item uuid, p_settled boolean default true)
returns void language plpgsql security definer set search_path = '' as $$
declare v_camp uuid;
begin
  select s.camp_id into v_camp from public.settlement_items i join public.settlements s on s.id = i.settlement_id where i.id = p_item;
  if v_camp is null or not private.is_fund_manager(v_camp) then raise exception 'forbidden'; end if;
  update public.settlement_items set settled_at = case when p_settled then now() end where id = p_item;
end;
$$;

-- ───── المهام المجدولة (تُستدعى من pg_cron، مو من التطبيق) ─────

-- تنزيل القطة الشهرية لكل مخيم (لو ما نزلت هذا الشهر)
create or replace function private.ensure_monthly_contributions()
returns void language plpgsql security definer set search_path = '' as $$
declare
  c record;
  v_period text;
  v_today date;
  v_due date;
  v_id uuid;
  v_title text;
  m record;
begin
  for c in select * from public.camps loop
    v_today := (now() at time zone c.timezone)::date;
    v_period := to_char(v_today, 'YYYY-MM');
    continue when exists (select 1 from public.contributions where camp_id = c.id and kind = 'monthly' and period = v_period);
    v_due := date_trunc('month', v_today)::date + (c.monthly_due_day - 1);
    v_title := 'قطة ' || private.ar_month(extract(month from v_today)::int);
    insert into public.contributions (camp_id, kind, title, amount_per_person, due_date, period)
    values (c.id, 'monthly', v_title, c.monthly_amount, v_due, v_period) returning id into v_id;
    for m in select id from public.members where camp_id = c.id loop
      insert into public.contribution_participants (contribution_id, member_id) values (v_id, m.id);
      perform private.notify(m.id, 'monthly_due', 'نزلت ' || v_title,
        private.money(c.monthly_amount) || '، تستحق ' || private.ar_weekday(v_due) || ' ' ||
          extract(day from v_due)::int || ' ' || private.ar_month(extract(month from v_due)::int),
        jsonb_build_object('url', '/qatta'));
    end loop;
  end loop;
end;
$$;

-- التذكيرات حسب الجدول: قبل الاستحقاق بثلاثة أيام، يوم الاستحقاق، وبعده حسب تكرار كل عضو
create or replace function private.queue_due_reminders()
returns void language plpgsql security definer set search_path = '' as $$
declare
  r record;
  v_step int;
  v_days int;
begin
  for r in
    select p.contribution_id, p.member_id, p.last_reminded_at, c.kind, c.due_date, c.id,
           (now() at time zone cp.timezone)::date as today,
           pr.frequency
      from public.contribution_participants p
      join public.contributions c on c.id = p.contribution_id and c.status = 'open'
      join public.camps cp on cp.id = c.camp_id
      left join public.notification_prefs pr on pr.member_id = p.member_id
        and pr.type = case when c.kind = 'monthly' then 'monthly_reminder'::public.notif_type else 'event_qatta'::public.notif_type end
     where p.paid_at is null
  loop
    v_days := r.today - r.due_date; -- سالب قبل الاستحقاق
    v_step := case r.frequency when 'daily' then 1 when 'weekly' then 7 else 2 end;
    if v_days = -3 or v_days = 0 or (v_days > 0 and v_days % v_step = 0) then
      continue when r.last_reminded_at is not null and r.last_reminded_at > now() - interval '20 hours';
      perform private.notify(r.member_id,
        case when r.kind = 'monthly' then 'monthly_reminder'::public.notif_type else 'event_qatta'::public.notif_type end,
        'تذكير', private.reminder_text(r.contribution_id),
        jsonb_build_object('url', case when r.kind = 'monthly' then '/qatta' else '/qatta/' || r.id end));
      update public.contribution_participants set last_reminded_at = now()
       where contribution_id = r.contribution_id and member_id = r.member_id;
    end if;
  end loop;
end;
$$;

-- إنهاء الجلسات اللي صار لها 12 ساعة
create or replace function private.end_stale_sessions()
returns void language sql security definer set search_path = '' as $$
  update public.sessions set ended_at = created_at + interval '12 hours'
   where ended_at is null and created_at <= now() - interval '12 hours';
$$;

-- ───── الصلاحيات النهائية للدوال ─────
revoke execute on all functions in schema public from public, anon;
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.my_member_id(uuid), private.my_member_ids(), private.is_camp_member(uuid),
  private.is_fund_manager(uuid), private.can_see_all_rows(uuid), private.is_participant(uuid) to authenticated;
grant execute on function
  public.create_camp(text, text), public.join_camp(text, text), public.get_invite_code(uuid),
  public.regenerate_invite_code(uuid), public.update_camp(uuid, numeric, int, double precision, double precision, int),
  public.transfer_fund_manager(uuid), public.set_my_payment(uuid, boolean, text),
  public.create_event_contribution(uuid, text, text, numeric, uuid[], date, boolean),
  public.remind_unpaid(uuid), public.close_contribution(uuid),
  public.announce(uuid, public.session_kind, public.treat_kind, timestamptz, text, public.presence_source),
  public.respond(uuid, public.reply_kind), public.leave_camp(uuid), public.geofence_event(uuid, boolean),
  public.account_summary(uuid), public.create_settlement(uuid, text), public.mark_settled(uuid, boolean)
to authenticated;

-- الدوال الجديدة مستقبلًا ما تنفتح تلقائيًا
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;
