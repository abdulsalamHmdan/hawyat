-- إرسال الإشعارات عبر Expo Push والمهام المجدولة. يحتاج pg_net و pg_cron (موجودين في Supabase).
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- يرسل اللي في الطابور لـ Expo Push (100 رسالة بالدفعة). أوقات الهدوء محسوبة في send_after.
create or replace function private.dispatch_notifications()
returns void language plpgsql security definer set search_path = '' as $$
declare
  batch jsonb;
  ids bigint[];
begin
  -- اللي ما عنده جهاز مسجّل: نعلّمه عشان ما يتكرر
  update public.notification_queue q set sent_at = now(), error = 'no_token'
   where q.sent_at is null and q.send_after <= now()
     and not exists (select 1 from public.push_tokens t where t.member_id = q.member_id);

  loop
    with picked as (
      select q.id from public.notification_queue q
       where q.sent_at is null and q.send_after <= now()
       order by q.id limit 100
       for update skip locked
    ), marked as (
      update public.notification_queue q set sent_at = now()
        from picked where q.id = picked.id
      returning q.*
    )
    select array_agg(m.id),
           jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
             'to', t.token,
             'title', m.title,
             'body', m.body,
             'sound', 'default',
             'data', m.data,
             'categoryId', m.category
           )))
      into ids, batch
      from marked m join public.push_tokens t on t.member_id = m.member_id;

    exit when ids is null;
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := batch,
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
    );
  end loop;
end;
$$;
revoke execute on function private.dispatch_notifications() from public, anon, authenticated;

-- كل دقيقة: أرسل الإشعارات
select cron.schedule('hawyat-dispatch', '* * * * *', $$select private.dispatch_notifications()$$);
-- كل يوم 6:00ص بتوقيت السعودية (3:00 UTC): نزّل القطة الشهرية لو بداية الشهر
select cron.schedule('hawyat-monthly', '0 3 * * *', $$select private.ensure_monthly_contributions()$$);
-- كل يوم 5:00م بتوقيت السعودية (14:00 UTC): التذكيرات المجدولة
select cron.schedule('hawyat-reminders', '0 14 * * *', $$select private.queue_due_reminders()$$);
-- كل ساعة: أنهِ الجلسات اللي صار لها 12 ساعة
select cron.schedule('hawyat-sessions', '15 * * * *', $$select private.end_stale_sessions()$$);
-- كل يوم: نظّف الطابور القديم
select cron.schedule('hawyat-cleanup', '30 2 * * *', $$delete from public.notification_queue where created_at < now() - interval '30 days'$$);
