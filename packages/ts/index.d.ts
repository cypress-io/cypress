// missing type definitions for 3rd party libraries
// https://glebbahmutov.com/blog/trying-typescript/#manual-types-for-3rd-party-libraries

// for execa module use @types/execa

declare module 'plist' {
  interface Plist {
    parse: (s: string) => any
  }
  const plist: Plist
  export = plist
}
