import type { Cookie } from 'tough-cookie'

// Shared with the cross-origin AUT injection: tough-cookie does not tie Secure to
// the page's scheme, does not require Secure for SameSite=None, and matches cookie
// prefixes case-sensitively
export const meetsSecureRules = (cookie: Pick<Cookie, 'key' | 'secure' | 'sameSite' | 'hostOnly' | 'path'>, isSecure: boolean) => {
  if (!cookie.secure) {
    return cookie.sameSite !== 'none' && !/^__(secure|host)-/i.test(cookie.key)
  }

  return isSecure && (!/^__host-/i.test(cookie.key) || (cookie.hostOnly === true && cookie.path === '/'))
}
