import net from 'net'
import tls from 'tls'
import url from 'url'
import { buildConnectReqHead, createProxySock, getProxyOrTargetOverrideForUrl, isResponseStatusCode200 } from '@packages/network'
import type { UpstreamConnectOptions, UpstreamConnection } from './mtls-bridge'

const HEADERS_END = Buffer.from('\r\n\r\n')

/**
 * Opens the real connection to an origin the bridge has taken over.
 *
 * `hosts` needs no handling here: `evil-dns` replaces `dns.lookup` for this whole process
 * and the server registers the user's entries at open, so a Node-side dial already resolves
 * them. An upstream proxy does not come for free, so it is established with CONNECT.
 */
/**
 * An origin or CONNECT proxy can complete TCP and then go silent. Without a deadline this
 * promise never settles, and everything that would clean up — the browser's `close` handler,
 * the `browserGone` check — is registered after the caller's await, so the socket and the
 * promise leak for the life of the process while the browser retries. Rejecting instead lets
 * the caller destroy the browser socket, so the browser sees a reset rather than a stall.
 */
const UPSTREAM_DEADLINE_MS = 30_000

export function connectUpstream (options: UpstreamConnectOptions): Promise<UpstreamConnection> {
  const { material, hostname, port, alpnProtocols } = options

  // held so the deadline can take down whichever socket exists when it fires
  let pending: net.Socket | undefined
  let timedOut = false

  const deadline = new Promise<never>((_resolve, reject) => {
    const timer = setTimeout(() => {
      timedOut = true
      pending?.destroy()
      reject(new Error(`Timed out after ${UPSTREAM_DEADLINE_MS}ms connecting to ${hostname}:${port}`))
    }, UPSTREAM_DEADLINE_MS)

    // the run should not be held open by a dial that already succeeded
    timer.unref()
  })

  const connecting = dial(hostname, port).then((socket) => {
    if (timedOut) {
      socket.destroy()

      throw new Error(`Timed out connecting to ${hostname}:${port}`)
    }

    pending = socket

    return new Promise<UpstreamConnection>((resolve, reject) => {
      const secure = tls.connect({
        socket,
        // A browser sends no SNI for an IP-literal URL, and Node deprecates setting one
        // (DEP0123) because RFC 6066 does not permit it, so the dial leaves it off for the
        // same reason the browser would have.
        servername: net.isIP(unbracket(hostname)) ? undefined : hostname,
        // An empty list is not the same as no ALPN: the browser offered none, so none is
        // offered upstream either.
        ALPNProtocols: alpnProtocols.length ? alpnProtocols : undefined,
        ca: material.ca?.length ? material.ca : undefined,
        cert: material.cert?.length ? material.cert : undefined,
        key: material.key?.map((k) => ({ pem: k.pem, passphrase: k.passphrase })),
        pfx: material.pfx?.map((p) => ({ buf: p.buf, passphrase: p.passphrase })),
      }, () => resolve({ socket: secure, alpnProtocol: secure.alpnProtocol }))

      pending = secure
      secure.once('error', reject)
    })
  })

  return Promise.race([connecting, deadline])
}

/**
 * `URL.hostname` keeps the brackets around an IPv6 literal, but `net.isIP` and `net.connect`
 * both want it bare. The bracketed form stays in the URL used for proxy resolution.
 */
function unbracket (hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname
}

function dial (hostname: string, port: number): Promise<net.Socket> {
  const href = `https://${hostname}:${port}`
  const proxy = getProxyOrTargetOverrideForUrl(href)

  if (!proxy) {
    return new Promise((resolve, reject) => {
      const socket = net.connect(port, unbracket(hostname), () => resolve(socket))

      socket.once('error', reject)
    })
  }

  return dialThroughProxy(hostname, port, proxy)
}

function dialThroughProxy (hostname: string, port: number, proxy: string): Promise<net.Socket> {
  const parsed = url.parse(proxy)

  return new Promise((resolve, reject) => {
    const onProxySock = (err?: Error, socket?: net.Socket) => {
      if (err || !socket) {
        return reject(err ?? new Error('no socket from upstream proxy'))
      }

      let head = Buffer.alloc(0)

      const cleanup = () => {
        socket.removeListener('error', onError)
        socket.removeListener('close', onClose)
        socket.removeListener('data', onData)
      }

      const fail = (message: string) => {
        cleanup()
        socket.destroy()
        reject(new Error(message))
      }

      const onError = (e: Error) => {
        cleanup()
        socket.destroy()
        reject(e)
      }

      // A proxy that accepts the connection and then closes it without answering would
      // otherwise leave this promise pending forever, hanging the request with no error.
      const onClose = () => {
        fail(`Upstream proxy closed the connection without answering CONNECT for ${hostname}:${port}`)
      }

      const onData = (chunk: Buffer) => {
        head = Buffer.concat([head, chunk])

        // The status line can arrive split across segments, and the status-code check
        // matches a prefix, so wait for the blank line that ends the headers before
        // judging the response.
        const end = head.indexOf(HEADERS_END)

        if (end === -1) {
          return
        }

        if (!isResponseStatusCode200(head.subarray(0, end).toString())) {
          return fail(`Upstream proxy refused CONNECT to ${hostname}:${port}`)
        }

        cleanup()

        // anything past the headers is already tunnel traffic
        const rest = head.subarray(end + HEADERS_END.length)

        if (rest.length) {
          socket.unshift(rest)
        }

        resolve(socket)
      }

      socket.on('error', onError)
      socket.on('close', onClose)
      socket.on('data', onData)

      socket.write(buildConnectReqHead(hostname, String(port), parsed))
    }

    createProxySock({ proxy: parsed, shouldRetry: true }, onProxySock as any)
  })
}
