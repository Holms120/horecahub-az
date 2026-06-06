export function translateAuthError(msg) {
  if (!msg) return 'Xəta baş verdi. Yenidən cəhd edin'
  const m = msg.toLowerCase()
  if (m.includes('user already registered') || m.includes('already registered'))
    return 'Bu email artıq qeydiyyatdan keçib'
  if (m.includes('invalid login credentials'))
    return 'Email və ya şifrə yanlışdır'
  if (m.includes('email not confirmed'))
    return 'Email təsdiqlənməyib. Zəhmət olmasa emailinizi yoxlayın'
  if (m.includes('password should be at least') || m.includes('password must be'))
    return 'Şifrə ən az 6 simvol olmalıdır'
  if (m.includes('unable to validate email') || m.includes('invalid format'))
    return 'Email formatı yanlışdır'
  return 'Xəta baş verdi. Yenidən cəhd edin'
}
