/**
 * `URL.hostname` keeps the brackets around an IPv6 literal, but `net`, `dns`, cookie
 * domains and Firefox's proxy preferences all want it bare.
 */
export function unbracket (hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname
}
