import { URL } from 'url'
import type { Url } from 'url'

/** The fields of a parsed URL that the agents and the client-certificate store read */
export type UrlFields = Pick<Url, 'protocol' | 'auth' | 'hostname' | 'port' | 'path' | 'href'>

// `scheme://` and the authority after it, up to the path, query or hash
const authorityRe = /^([a-z][a-z\d+.-]*:\/\/)([^/?#]*)/i

const decode = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/**
 * Parses `href` with `URL` into the shape `url.parse` gives, which callers
 * use to dial the host: `https://jane:p%40ss@[::1]:443/a?b=1` gives hostname
 * `::1`, port `'443'`, auth `jane:p@ss` and path `/a?b=1`.
 *
 * - The hostname loses its IPv6 brackets, so it can go to `net.connect` as is.
 * - The port is the one written in `href`, kept even when it is the scheme's
 *   default or out of range, or `null` if there is none. An out-of-range port,
 *   such as `70000`, still gives the hostname.
 * - Auth is the percent-decoded userinfo, keeping the colon of an empty
 *   password (`jane:`), ready for a `Proxy-Authorization` header.
 *
 * Every field but `href` is `null` when `URL` can't parse `href`, such as for
 * a hostname with `|` in it, which `url.parse` cut short to a different host.
 */
export function parseUrlFields (href: string): UrlFields {
  // `URL` trims the input and reads `\` as `/` in the authority, so read the written port the same way
  const authorityMatch = href.trim().replace(/\\/g, '/').match(authorityRe)
  const authority = authorityMatch?.[2] ?? ''
  const userinfoEnd = authority.lastIndexOf('@')
  const userinfo = userinfoEnd === -1 ? null : authority.slice(0, userinfoEnd)
  const hostAndPort = authority.slice(userinfoEnd + 1)
  // An IPv6 host ends in `]`, so only a port after it matches
  const writtenPort = hostAndPort.match(/:(\d+)$/)?.[1] ?? null

  const strict = URL.parse(href)
  const parsed = strict ?? (authorityMatch && writtenPort
    ? URL.parse(`${authorityMatch[1]}${authority.slice(0, -(writtenPort.length + 1))}${href.trim().slice(authorityMatch[0].length)}`)
    : null)

  if (!parsed) {
    return { protocol: null, auth: null, hostname: null, port: null, path: null, href }
  }

  return {
    protocol: parsed.protocol,
    auth: userinfo ? decode(userinfo) : null,
    hostname: parsed.hostname.replace(/^\[(.*)\]$/, '$1'),
    port: writtenPort ?? (parsed.port || null),
    path: `${parsed.pathname}${parsed.search}`,
    href: strict ? strict.href : href,
  }
}
