export function translateAuthError(msg) {
  if (!msg) return 'auth.errGeneral'
  const m = msg.toLowerCase()
  if (m.includes('user already registered') || m.includes('already registered'))
    return 'auth.errAlreadyRegistered'
  if (m.includes('invalid login credentials'))
    return 'auth.errInvalidCredentials'
  if (m.includes('email not confirmed'))
    return 'auth.errEmailNotConfirmed'
  if (m.includes('password should be at least') || m.includes('password must be'))
    return 'auth.errPassword'
  if (m.includes('unable to validate email') || m.includes('invalid format'))
    return 'auth.errInvalidEmailFormat'
  return 'auth.errGeneral'
}
