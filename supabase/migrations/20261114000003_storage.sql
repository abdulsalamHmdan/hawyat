-- تخزين الصور: الصور الرمزية، فواتير المصاريف، وصور التحويل.
-- المسار دايمًا يبدأ بـ {camp_id}/{member_id}/...
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', false),
  ('expense-receipts', 'expense-receipts', false),
  ('payment-receipts', 'payment-receipts', false)
on conflict (id) do nothing;

-- يرفع في مجلده فقط
create policy hawyat_upload_own on storage.objects for insert to authenticated with check (
  bucket_id in ('avatars', 'expense-receipts', 'payment-receipts')
  and (storage.foldername(name))[2]::uuid in (select private.my_member_ids())
);
create policy hawyat_delete_own on storage.objects for delete to authenticated using (
  bucket_id in ('avatars', 'expense-receipts', 'payment-receipts')
  and (storage.foldername(name))[2]::uuid in (select private.my_member_ids())
);

-- الصور الرمزية وفواتير المصاريف: كل أعضاء المخيم
create policy hawyat_read_camp on storage.objects for select to authenticated using (
  bucket_id in ('avatars', 'expense-receipts')
  and private.is_camp_member((storage.foldername(name))[1]::uuid)
);

-- صورة التحويل: صاحبها، ومنشئ القطة (أو مسؤول الصندوق للشهرية). المسار: {camp}/{member}/{contribution}/...
create policy hawyat_read_payment on storage.objects for select to authenticated using (
  bucket_id = 'payment-receipts'
  and (
    (storage.foldername(name))[2]::uuid in (select private.my_member_ids())
    or private.can_see_all_rows((storage.foldername(name))[3]::uuid)
  )
);
