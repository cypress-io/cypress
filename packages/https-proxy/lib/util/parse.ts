// Only an absolute-form `http://` target or Host header reaches `parse`, and its result
// is formatted into an `https:` URL: `url.parse` keeps an explicit port as written, such
// as `:80`, where `URL` drops the scheme's default port
// eslint-disable-next-line n/no-deprecated-api -- `http://host:80/` must keep its port
import { parse } from 'url'

function parseHost (hostString: string, defaultPort: number) {
  const m = hostString.match(/^http:\/\/(.*)/)

  if (m) {
    const parsedUrl = parse(hostString)

    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port,
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
  const m = reqUrl.match(/^http:\/\/([^/]*)\/?(.*)$/)

  if (m) {
    const parsedUrl = parse(reqUrl)

    hostPort.host = parsedUrl.hostname
    hostPort.port = parsedUrl.port
  }

  return hostPort
}

/**
 * The hostname a CONNECT request targets, from its authority-form `host:port` URL, or
 * an empty string if it has none. An IPv6 address comes back without brackets, which
 * is how the SNI servers and their certificates are keyed. The port is left out of the
 * parse, so one that `URL` rejects still yields the hostname.
 */
export function connectHostname (reqUrl: string | undefined): string {
  const host = (reqUrl ?? '').replace(/:\d*$/, '')

  try {
    return new URL(`https://${host}`).hostname.replace(/^\[(.*)\]$/, '$1')
  } catch {
    return ''
  }
}
