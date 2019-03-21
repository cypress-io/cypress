// missing type definitions for libraries
// https://glebbahmutov.com/blog/trying-typescript/#manual-types-for-3rd-party-libraries

declare module 'plist' {
  interface Plist {
    parse: (s:string) => any
  }
  const plist: Plist
  export = plist
}

declare module 'proxy-from-env' {
  const getProxyForUrl: (url: string) => string
}

declare module 'http' {
  import { Socket } from 'net'

  export interface Agent {
    addRequest(req: ClientRequest, options: any): void
    createSocket(req: ClientRequest, options: any, cb: (err: Error | undefined, sock: Socket) => void): void
  }

  export interface ClientRequest {
    _header: { [key: string]:string }
    _implicitHeader: () => void
    output: string[]
  }
}

declare interface Object {
  assign(...obj: any[]): any
}

declare interface SymbolConstructor {
  for(str: string): SymbolConstructor
}
