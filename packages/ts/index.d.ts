// missing type definitions for libraries

/// <reference path="typedefs/cypress-get-windows-proxy.d.ts" />
/// <reference path="typedefs/cypress-request-promise.d.ts" />

declare module 'http' {
  import { Socket } from 'net'
  import { Url } from 'url'
  import { Duplex } from 'stream'

    type SocketCallback = (err: Optional<Error>, sock: Optional<Socket>) => void

    interface Agent {
      addRequest(req: ClientRequest, options: RequestOptions): void
      createSocket(req: ClientRequest, options: RequestOptions, cb: SocketCallback): void
      createConnection(options: RequestOptions, callback?: ((err: Error | null, stream: Duplex) => void) | undefined): Duplex | null | undefined
      protocol: 'http:' | 'https:' | string
    }

    interface ClientRequest {
      _header?: { [key: string]: string }
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
      uri?: Url
    }
}

declare module 'https' {
  interface Agent {
    _sessionCache: { [_agentKey: string]: Buffer }
  }
}

declare interface InternalStream {
  queue(str: string | null): void
}

declare module 'net' {
  type family = 4 | 6

  interface Address {
    address: string
    family: family
  }
}

declare type Optional<T> = T | void

declare module 'plist' {
  interface Plist {
    parse: (s: string) => any
  }
  const plist: Plist
  export = plist
}
