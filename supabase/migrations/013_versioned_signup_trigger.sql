-- ============================================================
-- HorecaHub.az — version the signup trigger + close the ON CONFLICT bypass
--
-- Idempotent — safe to re-run. Apply in the Supabase SQL editor.
--
-- WHY THIS EXISTS
-- public.handle_new_user() (trigger on_auth_user_created, AFTER INSERT on
-- auth.users) was created in the dashboard and versioned nowhere. It is the
-- only thing that creates a public.profiles row, so it is load-bearing for
-- signup — yet a rebuild from this repo would not recreate it. This file is a
-- verbatim copy of the deployed function with one defect fixed.
--
-- THE DEFECT
-- The original ended with:
--     ON CONFLICT (id) DO UPDATE SET ... account_type = EXCLUDED.account_type
-- That branch is an UPDATE, not an INSERT, so:
--   • hold_supplier_signup (009) is BEFORE INSERT — it does not fire, so the
--     supplier -> individual/pending interception is skipped entirely;
--   • protect_profile_privileged_columns (009) is BEFORE UPDATE and does fire,
--     but it opens with `if auth.uid() is null then return new; end if;` and
--     during signup there is no JWT, so it returns early and freezes nothing.
-- Net effect: on the conflict path, account_type = 'supplier' is written
-- straight from user-supplied auth metadata, granting supplier status with no
-- admin review — the exact escalation migration 009 was written to prevent.
--
-- THE FIX
-- account_type is never updated from metadata on the conflict path; granting it
-- stays an admin decision (review_supplier_application). A returning signup that
-- asks for supplier is turned into a pending APPLICATION instead of being
-- silently dropped, so the request still reaches the admin panel.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, full_name, phone, city, account_type, company_name, phone2, supplier_categories
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'city',
    -- Left as-is on the INSERT path: hold_supplier_signup (009) is BEFORE
    -- INSERT and rewrites 'supplier' to individual + supplier_status='pending'.
    coalesce(new.raw_user_meta_data ->> 'account_type', 'individual'),
    new.raw_user_meta_data ->> 'company_name',
    new.raw_user_meta_data ->> 'phone2',
    case
      when new.raw_user_meta_data -> 'supplier_categories' is not null
      then array(select jsonb_array_elements_text(new.raw_user_meta_data -> 'supplier_categories'))
      else '{}'::text[]
    end
  )
  on conflict (id) do update set
    full_name           = excluded.full_name,
    phone               = excluded.phone,
    city                = excluded.city,
    company_name        = excluded.company_name,
    phone2              = excluded.phone2,
    supplier_categories = excluded.supplier_categories,
    -- account_type is deliberately NOT taken from excluded: on this UPDATE path
    -- neither 009 trigger constrains it, so copying it would hand out supplier
    -- status straight from user-controlled metadata. It stays admin-granted.
    account_type        = public.profiles.account_type,
    -- ...but do not lose the request: an existing non-supplier row whose signup
    -- metadata asks for supplier becomes a pending application for review.
    supplier_status     = case
      when excluded.account_type = 'supplier'
       and public.profiles.account_type <> 'supplier'
       and coalesce(public.profiles.supplier_status, 'none') in ('none', 'rejected')
      then 'pending'
      else public.profiles.supplier_status
    end,
    supplier_requested_at = case
      when excluded.account_type = 'supplier'
       and public.profiles.account_type <> 'supplier'
       and coalesce(public.profiles.supplier_status, 'none') in ('none', 'rejected')
      then now()
      else public.profiles.supplier_requested_at
    end;

  return new;
end;
$$;

-- Recreate the trigger so a rebuild from this repo reproduces it.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Verify afterwards:
--   • register a NEW supplier account
--       ⇒ profiles row is account_type='individual', supplier_status='pending'
--       ⇒ it appears in the admin panel under "Təchizatçı müraciətləri"
--   • register a normal account ⇒ account_type='individual', supplier_status='none'
--   • no existing supplier loses its status (account_type is never downgraded)
