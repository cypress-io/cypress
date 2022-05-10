// missing type definitions for libraries
// https://glebbahmutov.com/blog/trying-typescript/#manual-types-for-3rd-party-libraries

declare module '@cypress/get-windows-proxy' {
  type ProxyConfig = {
    httpProxy: string
    noProxy: string
  }
  function getWindowsProxy(): Optional<ProxyConfig>
  export = getWindowsProxy
}

declare module 'http' {
import { Socket } from 'net'
import { Url } from 'url'

    type SocketCallback = (err: Optional<Error>, sock: Optional<Socket>) => void

  interface Agent {
    addRequest(req: ClientRequest, options: RequestOptions): void
    createConnection(options: RequestOptions, cb: Optional<SocketCallback>): void
  }

  interface ClientRequest {
    _header?: { [key: string]: string }
    _implicitHeader: () => void
    output: string[]
    agent: Agent
    insecureHTTPParser: boolean
    maxHeaderSize?: number
  }

  interface RequestOptions extends ClientRequestArgs {
    _agentKey: Optional<symbol>
    host: string
    href: string
    port: number
    proxy: Optional<string>
    socket: Optional<Socket>
    uri: Url
  }

  export const CRLF: string
}

declare interface InternalStream {
  queue(str: string | null): void
}

declare module 'net' {
  type family = 4 | 6
  type TCPSocket = {}

  interface Address {
    address: string
    family: family
  }
}

declare type Optional<T> = T | void

declare module 'url' {
  interface UrlWithStringQuery {
    format(): string
  }
}
