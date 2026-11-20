import { URL } from 'url'
import type { Url } from 'url'

/** The fields of a parsed URL that the agents and the client-certificate store read */
export type UrlFields = Pick<Url, 'protocol' | 'auth' | 'hostname' | 'port' | 'path' | 'href'>

// The port written in the authority, which `URL` drops when it is the scheme's default
const explicitPortRe = /^[a-z][a-z\d+.-]*:\/\/(?:[^@/?#]*@)?(?:\[[^\]]*\]|[^:/?#]*):(\d+)(?:[/?#]|$)/i

/**
 * Parses `href` with `URL` into the shape `url.parse` gives, which callers
 * use to dial the host: `https://jane:p%40ss@[::1]:443/a?b=1` gives hostname
 * `::1`, port `'443'`, auth `jane:p@ss` and path `/a?b=1`.
 *
 * - The hostname loses its IPv6 brackets, so it can go to `net.connect` as is.
 * - The port is the one written in `href`, kept even when it is the scheme's
 *   default, or `null` if there is none.
 * - Auth is percent-decoded, ready for a `Proxy-Authorization` header.
 *
 * Every field but `href` is `null` when `URL` can't parse `href`.
 */
export function parseUrlFields (href: string): UrlFields {
  const parsed = URL.parse(href)

  if (!parsed) {
    return { protocol: null, auth: null, hostname: null, port: null, path: null, href }
  }

  const username = decodeURIComponent(parsed.username)
  const password = decodeURIComponent(parsed.password)

  return {
    protocol: parsed.protocol,
    auth: password ? `${username}:${password}` : (username || null),
    hostname: parsed.hostname.replace(/^\[(.*)\]$/, '$1'),
    port: parsed.port || href.match(explicitPortRe)?.[1] || null,
    path: `${parsed.pathname}${parsed.search}`,
    href: parsed.href,
  }
}
