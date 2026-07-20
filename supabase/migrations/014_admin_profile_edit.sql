-- ============================================================
-- HorecaHub.az — admin can edit any user's profile fields
--
-- Idempotent — safe to re-run. Apply in the Supabase SQL editor.
--
-- Same shape as set_user_blocked (011) and review_supplier_application
-- (009): the only UPDATE policy on profiles is profiles_update_own, so an
-- admin editing someone else's row must go through a SECURITY DEFINER
-- function rather than a direct client update (which would match zero
-- rows and be misread as success).
--
-- Deliberately out of scope here: account_type, is_admin, is_blocked,
-- supplier_status and the review_* columns — those already have
-- dedicated, audited entry points (review_supplier_application,
-- set_user_blocked) and are not touched by this function.
-- ============================================================

create or replace function public.admin_update_profile(
  p_user_id uuid,
  p_full_name text,
  p_company_name text,
  p_phone text,
  p_phone2 text,
  p_city text,
  p_description text,
  p_supplier_categories text[]
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  _row public.profiles;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  ) then
    raise exception 'not authorized';
  end if;

  update public.profiles
  set full_name           = btrim(coalesce(p_full_name, '')),
      company_name        = nullif(btrim(coalesce(p_company_name, '')), ''),
      phone               = btrim(coalesce(p_phone, '')),
      phone2              = nullif(btrim(coalesce(p_phone2, '')), ''),
      city                = btrim(coalesce(p_city, '')),
      description         = nullif(btrim(coalesce(p_description, '')), ''),
      supplier_categories = coalesce(p_supplier_categories, '{}'::text[])
  where id = p_user_id
  returning * into _row;

  if not found then
    raise exception 'no such user: %', p_user_id;
  end if;

  return _row;
end;
$$;

revoke all on function public.admin_update_profile(uuid, text, text, text, text, text, text, text[]) from public;
grant execute on function public.admin_update_profile(uuid, text, text, text, text, text, text, text[]) to authenticated;

-- Verify afterwards:
--   • as admin: edit another user's name/phone/city/description in
--     /admin → Users → Redaktə  ⇒ persists after reload
--   • as a non-admin JWT calling admin_update_profile directly ⇒ 'not authorized'
