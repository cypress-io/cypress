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
    createSocket(req: ClientRequest, options: RequestOptions, cb: SocketCallback): void
    createConnection(options: RequestOptions, cb: Optional<SocketCallback>): void
    protocol: 'http:' | 'https:' | string
    freeSockets: {
      [key: string]: Socket[]
    }
  }

  interface ClientRequest {
    _header: { [key: string]: string }
    _implicitHeader: () => void
    output: string[]
    agent: Agent
  }

  interface RequestOptions extends ClientRequestArgs {
    _agentKey: Optional<symbol>
    host: string
    href: string
    port: number
    proxy: Optional<string>
    servername: Optional<string>
    socket: Optional<Socket>
    uri: Url
  }

  export const CRLF: string
}

declare module 'https' {
  interface Agent {
    _sessionCache: { [_agentKey: string]: Buffer }
  }
}

declare module 'net' {
  type family = 4 | 6
  type TCPSocket = {}

  interface Address {
    address: string
    family: family
  }

  interface Socket {
    _handle: TCPSocket | null
  }

}

declare interface Object {
  assign(...obj: any[]): any
}

declare type Optional<T> = T | void

declare module 'plist' {
  interface Plist {
    parse: (s: string) => any
  }
  const plist: Plist
  export = plist
}

declare module 'proxy-from-env' {
  const getProxyForUrl: (url: string) => string
}

declare interface SymbolConstructor {
  for(str: string): SymbolConstructor
}

declare interface InternalStream {
  queue(str: string | null): void
}
