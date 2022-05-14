declare namespace Cypress {
  interface RemoteState {
    auth?: Auth
    domainName: string
    strategy: 'file' | 'http'
    origin: string
    fileServer: string | null
    props: Record<string, any>
  }

  interface RuntimeConfigOptions {
    remote: RemoteState
  }
}
