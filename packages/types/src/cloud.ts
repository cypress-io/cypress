export type CloudApi = {
  retryWithBackoff (fn: (attemptIndex: number) => Promise<any>): Promise<any>
  requestPromise: {
    get (options: any): Promise<any>
  }
  publicKeyVersion: string
  enc: {
    verifySignature (body: string, signature: string): boolean
  }
  baseUrl: string
}
