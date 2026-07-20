-- ============================================================
-- HorecaHub.az — only admins may send "HorecaHub Support" messages
--
-- Idempotent — safe to re-run. Apply in the Supabase SQL editor.
--
-- PROBLEM: messages.is_support is what the UI uses to paint a message as an
-- official support reply — the green 🛡 bubble in Messages.jsx / SupportChat.jsx.
-- The insert policy (000_rls_policies.sql: messages_insert_own) only checks that
-- auth.uid() = sender_id and that the sender is not blocked; nothing constrains
-- is_support. Any logged-in user could therefore POST /rest/v1/messages with
-- {"is_support": true} and have their text rendered to the recipient as an
-- official HorecaHub Support message — a ready-made phishing primitive
-- ("your account is suspended, confirm your details at …").
--
-- 002_security_core.sql already narrowed UPDATE to the is_read column only, so
-- the flag cannot be flipped after the fact; INSERT was the remaining hole.
-- ============================================================

create or replace function public.enforce_support_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- No JWT (service_role / SQL editor / edge functions using the service key)
  -- bypasses RLS entirely and is trusted; leave the row as supplied.
  if auth.uid() is null then
    return new;
  end if;

  if coalesce(new.is_support, false) then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    ) then
      new.is_support := false;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_support_flag on public.messages;
create trigger trg_enforce_support_flag
  before insert on public.messages
  for each row
  execute function public.enforce_support_flag();

-- Verify afterwards:
--   • as a normal user JWT:
--       POST /rest/v1/messages {"receiver_id":"<someone>","content":"x","is_support":true}
--     ⇒ row is stored with is_support = false (silently downgraded, not rejected,
--       so the legitimate send path keeps working)
--   • as an admin (panel approve/reject, SuppliersTab.review, ModerationTab)
--     ⇒ is_support stays true and the recipient still sees the 🛡 bubble
