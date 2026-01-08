import { parse } from 'url'

function parseHost (hostString: string, defaultPort: number) {
  let m

  m = hostString.match(/^http:\/\/(.*)/)

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
  let m
  const {
    host,
  } = headers

  const hostPort = parseHost(host, defaultPort)

  // this handles paths which include the full url. This could happen if it's a proxy
  m = reqUrl.match(/^http:\/\/([^\/]*)\/?(.*)$/)

  if (m) {
    const parsedUrl = parse(reqUrl)

    hostPort.host = parsedUrl.hostname
    hostPort.port = parsedUrl.port
    reqUrl = parsedUrl.path
  }

  return hostPort
}
