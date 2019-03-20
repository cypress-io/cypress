// missing type definitions for 3rd party libraries
// https://glebbahmutov.com/blog/trying-typescript/#manual-types-for-3rd-party-libraries

// for execa module use @types/execa

declare module 'plist' {
  interface Plist {
    parse: (s:string) => any
  }
  const plist: Plist
  export = plist
}

declare module 'http' {
  interface Agent {
    addRequest(req: ClientRequest, options: any): void
    createSocket(req: ClientRequest, options: any, cb: (err?: Error, sock: Socket) => void): void
  }
}
