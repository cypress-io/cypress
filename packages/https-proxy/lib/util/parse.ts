import { URL } from 'url'

/**
 * Returns the hostname of a `host:port` authority, or `''` if it has none:
 * `Example.com:443` becomes `example.com`, `[::1]:8443` becomes `::1`, and
 * `user:pass@example.com` becomes `example.com`.
 *
 * The port is dropped before parsing so that one `URL` rejects, such as `99999`,
 * doesn't cost the hostname. The IPv6 brackets `URL` keeps are removed, because
 * `net.isIP` and certificate generation expect the bare address.
 */
export function hostnameFromAuthority (authority: string | undefined): string {
  const hostname = URL.parse(`https://${(authority ?? '').replace(/:\d*$/, '')}`)?.hostname ?? ''

  return hostname.replace(/^\[(.*)\]$/, '$1')
}

/** The explicit port of a `host:port` authority, or `null` if it has none: `example.com:80` gives `'80'` */
function portFromAuthority (authority: string): string | null {
  return authority.match(/:(\d+)$/)?.[1] ?? null
}

function parseHost (hostString: string, defaultPort: number) {
  const m = hostString.match(/^http:\/\/([^/?#]*)/)

  if (m) {
    return {
      host: hostnameFromAuthority(m[1]),
      port: portFromAuthority(m[1]),
    }
  }

  const hostPort = hostString.split(':')
  const host = hostPort[0]
  const port = hostPort.length === 2 ? +hostPort[1] : defaultPort

  return {
    host,
    port,
  }
}

export function hostAndPort (reqUrl: string, headers: any, defaultPort: number) {
  const {
    host,
  } = headers

  const hostPort = parseHost(host, defaultPort)

  // this handles paths which include the full url. This could happen if it's a proxy
  const m = reqUrl.match(/^http:\/\/([^/?#]*)\/?(.*)$/)

  if (m) {
    hostPort.host = hostnameFromAuthority(m[1])
    hostPort.port = portFromAuthority(m[1])
  }

  return hostPort
}
