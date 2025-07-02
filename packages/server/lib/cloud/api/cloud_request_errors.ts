export class DecryptionError extends Error {
  isDecryptionError = true

  constructor (message: string) {
    super(message)
    this.name = 'DecryptionError'
  }
}
