-- اختبارات قواعد الخصوصية (docs/SPEC.md القسم 9) وغيرها.
-- يشتغل بعد الهجرات. أي فشل يوقف التشغيل (ON_ERROR_STOP).
\set ON_ERROR_STOP 1
\set QUIET 1

create schema test;
create table test.ids (key text primary key, val uuid);
grant usage on schema test to authenticated;
grant select on test.ids to authenticated;

create function test.id(k text) returns uuid language sql stable as $$ select val from test.ids where key = k $$;
create function test.assert(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'فشل: %', msg; end if;
  raise notice 'تمام: %', msg;
end $$;
create function test.login(k text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', test.id('user_' || k)::text, false);
$$;
grant execute on all functions in schema test to authenticated;

insert into test.ids values
  ('user_A', gen_random_uuid()), ('user_B', gen_random_uuid()),
  ('user_C', gen_random_uuid()), ('user_D', gen_random_uuid());
insert into auth.users (id) select val from test.ids;

\set asA 'reset role; select test.login(''A''); set role authenticated;'
\set asB 'reset role; select test.login(''B''); set role authenticated;'
\set asC 'reset role; select test.login(''C''); set role authenticated;'
\set asD 'reset role; select test.login(''D''); set role authenticated;'
\set asAdmin 'reset role;'

-- ───── التجهيز: A ينشئ المخيم (مسؤول الصندوق)، B و C ينضمون، D برّا المخيم ─────
:asA
select public.create_camp('الحاويات', 'عبدالسلام') as camp \gset
select public.get_invite_code(:'camp') as code \gset
:asB
select public.join_camp(:'code', 'محمد');
:asC
select public.join_camp(:'code', 'خالد');
:asAdmin
insert into test.ids values ('camp', :'camp');
insert into test.ids select 'member_' || k, m.id from public.members m
  join (values ('A', 'عبدالسلام'), ('B', 'محمد'), ('C', 'خالد')) v(k, n) on m.display_name = v.n;

-- القطة الشهرية تنزل للكل
select private.ensure_monthly_contributions();
insert into test.ids select 'monthly', id from public.contributions where kind = 'monthly';
select test.assert((select count(*) from public.contribution_participants where contribution_id = test.id('monthly')) = 3,
  'القطة الشهرية نزلت لكل الأعضاء الثلاثة');

-- A يسوي قطة عشاء لـ B و C
:asA
select public.create_event_contribution(test.id('camp'), 'عشاء الجمعة', 'total', 270,
  array[test.id('member_B'), test.id('member_C')], current_date + 3, true) as dinner \gset
:asAdmin
insert into test.ids values ('dinner', :'dinner');
select test.assert((select amount_per_person from public.contributions where id = test.id('dinner')) = 90,
  'المبلغ الكامل يتقسم بالتساوي (270 على 3 بما فيهم المنشئ)');
select test.assert(not exists (select 1 from public.contribution_participants where contribution_id = test.id('dinner') and member_id = test.id('member_A')),
  'المنشئ ما ينضاف له صف دفع في قطته');

-- B يدفع
:asB
select public.set_my_payment(test.id('dinner'), true);
select public.set_my_payment(test.id('monthly'), true);

-- ───── القاعدة 1: العضو ما يقرأ صف دفع غيره في قطة ما سوّاها ─────
:asC
select test.assert((select count(*) from public.contribution_participants where member_id = test.id('member_B')) = 0,
  'ق1: خالد ما يشوف أي صف دفع لمحمد');
select test.assert((select bool_and(member_id = test.id('member_C')) from public.contribution_participants),
  'ق1: خالد يشوف صفوفه هو فقط');
select test.assert((select count(*) from public.contribution_participants where contribution_id = test.id('dinner')) = 1,
  'ق1: في قطة العشاء خالد يشوف صف واحد (صفه)');
:asB
select test.assert((select count(*) from public.contribution_participants where contribution_id = test.id('monthly')) = 1,
  'ق1: محمد (مو مسؤول الصندوق) يشوف صفه بس في القطة الشهرية');
:asD
select test.assert((select count(*) from public.contribution_participants) = 0, 'ق1: اللي برّا المخيم ما يشوف شي');
select test.assert((select count(*) from public.contributions) = 0, 'اللي برّا المخيم ما يشوف أي قطة');
select test.assert((select count(*) from public.members) = 0, 'اللي برّا المخيم ما يشوف الأعضاء');

-- قطة مناسبة ما يشوفها إلا منشئها والمشمولين
:asB
select public.create_event_contribution(test.id('camp'), 'حطب', 'per', 30, array[test.id('member_A')], current_date + 2, true) as wood \gset
:asAdmin
insert into test.ids values ('wood', :'wood');
:asC
select test.assert((select count(*) from public.contributions where id = test.id('wood')) = 0,
  'خالد ما يدري عن قطة الحطب لأنه مو فيها');

-- ───── القاعدة 2: المنشئ يقرأ كل صفوف قطته، ومسؤول الصندوق صفوف الشهرية ─────
:asA
select test.assert((select count(*) from public.contribution_participants where contribution_id = test.id('dinner')) = 2,
  'ق2: منشئ قطة العشاء يشوف كل صفوفها');
select test.assert((select count(*) from public.contribution_participants where contribution_id = test.id('monthly')) = 3,
  'ق2: مسؤول الصندوق يشوف كل صفوف القطة الشهرية');
select test.assert((select count(*) from public.contribution_participants where contribution_id = test.id('wood')) = 1,
  'ق2: عبدالسلام يشوف صفه بس في قطة الحطب (ما سوّاها)');

-- ───── القاعدة 3: لا أحد يعدّل paid_at إلا صاحب الصف ─────
:asA
do $$ declare blocked boolean := false; begin
  begin
    update public.contribution_participants set paid_at = null where contribution_id = test.id('dinner');
  exception when insufficient_privilege then blocked := true; end;
  perform test.assert(blocked, 'ق3: المنشئ ما يقدر يعدّل paid_at مباشرة');
end $$;
do $$ declare blocked boolean := false; begin
  begin
    perform public.set_my_payment(test.id('dinner'), true);
  exception when others then blocked := true; end;
  perform test.assert(blocked, 'ق3: المنشئ ما يقدر يسجّل دفع في قطته باسم أحد');
end $$;
:asC
do $$ declare blocked boolean := false; begin
  begin
    insert into public.contribution_participants (contribution_id, member_id, paid_at) values (test.id('wood'), test.id('member_C'), now());
  exception when insufficient_privilege then blocked := true; end;
  perform test.assert(blocked, 'ق3: ما أحد يضيف صفوف دفع مباشرة');
end $$;
:asB
select public.set_my_payment(test.id('dinner'), false);
:asAdmin
select test.assert((select paid_at is null from public.contribution_participants where contribution_id = test.id('dinner') and member_id = test.id('member_B')),
  'ق3: صاحب الصف يقدر يتراجع');
:asB
select public.set_my_payment(test.id('dinner'), true);
:asAdmin
select test.assert((select paid_at is not null from public.contribution_participants where contribution_id = test.id('dinner') and member_id = test.id('member_B')),
  'ق3: صاحب الصف يسجّل «دفعت» فورًا');

-- ───── القاعدة 4: ما فيه endpoint أو view يرجّع عدد أو نسبة الدافعين لغير المنشئ ─────
select test.assert((select count(*) from information_schema.views where table_schema = 'public') = 0,
  'ق4: ما فيه أي view مكشوف');
select test.assert((select count(*) from pg_matviews where schemaname = 'public') = 0, 'ق4: ما فيه materialized views');
select test.assert(
  (select array_agg(p.proname::text order by p.proname) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'execute'))
  = array['account_summary','announce','close_contribution','create_camp','create_event_contribution','create_settlement',
          'geofence_event','get_invite_code','join_camp','leave_camp','mark_settled','regenerate_invite_code','remind_unpaid',
          'respond','set_my_payment','transfer_fund_manager','update_camp'],
  'ق4: الدوال المكشوفة هي القائمة المراجعة بس (أي دالة جديدة لازم تنراجع هنا)');
select test.assert(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')) = 0,
  'ق4: ولا دالة مفتوحة لغير المسجّلين');
select test.assert(
  (select count(*) from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public') = 0,
  'ولا جدول مفتوح لغير المسجّلين');
:asC
do $$ declare r record; begin
  select * into r from public.account_summary(test.id('camp'));
  perform test.assert(r.owed_to_me = 0 and r.spent_this_month = 0, 'ق4: ملخص الحساب يرجّع أرقامك أنت');
end $$;
do $$ declare blocked boolean := false; begin
  begin perform public.remind_unpaid(test.id('dinner'));
  exception when others then blocked := true; end;
  perform test.assert(blocked, 'ق4: غير المنشئ ما يقدر يذكّر (ولا يعرف مين ما دفع)');
end $$;

-- ───── القاعدة 5: إشعار التذكير ما فيه اسم اللي ضغط «ذكّر» ─────
:asA
select public.remind_unpaid(test.id('dinner'));
select public.remind_unpaid(test.id('monthly'));
:asAdmin
select test.assert((select count(*) from public.notification_queue where member_id = test.id('member_C') and title = 'تذكير') = 2,
  'ق5: خالد (ما دفع) وصله تذكير العشاء والشهرية');
select test.assert((select count(*) from public.notification_queue where member_id = test.id('member_B') and title = 'تذكير') = 0,
  'ق5: محمد (دفع) ما وصله تذكير');
select test.assert((select bool_and(position('عبدالسلام' in title || body || data::text) = 0) from public.notification_queue where title = 'تذكير'),
  'ق5: التذكير ما فيه اسم اللي ضغط');
select test.assert((select bool_and(body !~ '(متأخر|!)') from public.notification_queue where title = 'تذكير'),
  'ق5: نص التذكير محايد: بلا «متأخر» وبلا علامات تعجب');
:asA
select public.remind_unpaid(test.id('dinner'));
:asAdmin
select test.assert((select count(*) from public.notification_queue where member_id = test.id('member_C') and title = 'تذكير') = 2,
  'التذكير ما يتكرر بنفس اليوم');

-- ───── حماية ثانية ─────
:asB
do $$ declare blocked boolean := false; begin
  begin perform 1 from public.notification_queue limit 1;
  exception when insufficient_privilege then blocked := true; end;
  perform test.assert(blocked, 'طابور الإشعارات مقفول على التطبيق');
end $$;
do $$ declare blocked boolean := false; begin
  begin perform invite_code from public.camps;
  exception when insufficient_privilege then blocked := true; end;
  perform test.assert(blocked, 'كود الدعوة ما يقرأه إلا مسؤول الصندوق (بالدالة)');
end $$;
do $$ declare blocked boolean := false; begin
  begin perform public.get_invite_code(test.id('camp'));
  exception when others then blocked := true; end;
  perform test.assert(blocked, 'العضو العادي ما ياخذ كود الدعوة');
end $$;
do $$ declare blocked boolean := false; begin
  begin
    insert into public.expenses (camp_id, paid_by, amount, category) values (test.id('camp'), test.id('member_A'), 50, 'gas');
  exception when insufficient_privilege or check_violation then blocked := true;
            when others then blocked := sqlstate = '42501'; end;
  perform test.assert(blocked, 'ما تقدر تسجّل مصروف باسم غيرك');
end $$;
insert into public.expenses (camp_id, paid_by, amount, category, description) values (test.id('camp'), test.id('member_B'), 150, 'firewood', 'حطب');
insert into public.push_tokens (member_id, token) values (test.id('member_B'), 'ExponentPushToken[bbb]');
:asC
select test.assert((select count(*) from public.expenses) = 1, 'سجل المصاريف يشوفه كل الأعضاء');
select test.assert((select count(*) from public.push_tokens) = 0, 'رموز إشعارات غيرك ما تنقرأ');
do $$ declare n int; begin
  update public.members set display_name = 'هكر' where id = test.id('member_B');
  get diagnostics n = row_count;
  perform test.assert(n = 0, 'ما تقدر تعدّل اسم غيرك');
end $$;
do $$ declare blocked boolean := false; begin
  begin update public.members set role = 'fund_manager' where id = test.id('member_C');
  exception when insufficient_privilege then blocked := true; end;
  perform test.assert(blocked, 'ما تقدر ترقّي نفسك لمسؤول الصندوق');
end $$;

-- ───── الحضور والدعوات والتفضيلات ─────
:asC
insert into public.notification_prefs (member_id, type, enabled) values (test.id('member_C'), 'arrival', false);
:asB
select public.announce(test.id('camp'), 'arrived', null, null, null) as s1 \gset
:asAdmin
select test.assert((select count(*) from public.notification_queue where type = 'arrival' and member_id = test.id('member_A')) = 1,
  'وصول محمد وصل لعبدالسلام');
select test.assert((select count(*) from public.notification_queue where type = 'arrival' and member_id = test.id('member_C')) = 0,
  'خالد مطفي إشعار الوصول فما وصله');
:asA
select public.announce(test.id('camp'), 'arrived', 'dinner', now() + interval '2 hours', 'تعالوا بدري') as s2 \gset
:asAdmin
select test.assert(:'s1' = :'s2', 'الواصل الثاني ينضم لنفس الجلسة');
select test.assert((select host_id = test.id('member_A') and treat = 'dinner' from public.sessions where id = :'s1'), 'العزيمة انحطت على الجلسة');
:asC
select public.respond(:'s1', 'dinner');
:asB
select public.leave_camp(test.id('camp'));
:asAdmin
select test.assert((select ended_at is null from public.sessions where id = :'s1'), 'الجلسة ما تنتهي وفيه أحد موجود');
:asA
select public.leave_camp(test.id('camp'));
:asAdmin
select test.assert((select ended_at is not null from public.sessions where id = :'s1'), 'الجلسة تنتهي لما آخر واحد يطلع');

-- أوقات الهدوء: إشعار الساعة 2 الفجر يتأجل لـ 7 الصباح بتوقيت المخيم
select test.assert(
  private.send_time(test.id('member_A'), ((current_date + 1) + time '02:00') at time zone 'Asia/Riyadh')
  = ((current_date + 1) + time '07:00') at time zone 'Asia/Riyadh',
  'أوقات الهدوء تأجل الإشعار لنهايتها');
select test.assert(
  private.send_time(test.id('member_A'), ((current_date + 1) + time '20:00') at time zone 'Asia/Riyadh')
  = ((current_date + 1) + time '20:00') at time zone 'Asia/Riyadh',
  'خارج أوقات الهدوء يرسل فورًا');

-- التسوية
:asB
do $$ declare blocked boolean := false; begin
  begin perform public.create_settlement(test.id('camp'));
  exception when others then blocked := true; end;
  perform test.assert(blocked, 'التسوية لمسؤول الصندوق فقط');
end $$;
:asA
select public.create_settlement(test.id('camp'));
:asB
select test.assert((select owed_to_me from public.account_summary(test.id('camp'))) = 150, 'محمد له 150 من الصندوق قبل التحويل');
:asA
select public.mark_settled((select id from public.settlement_items where member_id = test.id('member_B')));
:asB
select test.assert((select owed_to_me from public.account_summary(test.id('camp'))) = 0, 'بعد «تمت التسوية» ما له شي');
select test.assert((select fund_balance from public.account_summary(test.id('camp'))) = 150,
  'رصيد الصندوق = القطط الشهرية المدفوعة (300) − المصاريف المتسوية (150)');
:asC
select test.assert((select count(*) from public.settlement_items) = 0, 'خالد ما يشوف بنود تسوية غيره');

-- المهام المجدولة تشتغل بدون أخطاء
:asAdmin
update public.contributions set due_date = current_date where id = test.id('wood');
select private.queue_due_reminders();
select private.end_stale_sessions();
select private.ensure_monthly_contributions();
select test.assert((select count(*) from public.contributions where kind = 'monthly') = 1, 'القطة الشهرية ما تنزل مرتين بنفس الشهر');
select test.assert(exists (select 1 from public.notification_queue where member_id = test.id('member_A') and body like 'تذكير: حطب 30 ريال، تستحق اليوم'),
  'تذكير يوم الاستحقاق نزل بالنص المحايد');

reset role;
\echo 'كل اختبارات الخصوصية نجحت'
