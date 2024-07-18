const Kinds = Object.freeze({
  CDP_CRASHED: 'cdp_crashed',
  CDP_DISCONNECTED: 'cdp_disconnected',
  CDP_TERMINATED: 'cdp_terminated',
})

type CdpErrorKind = typeof Kinds[keyof typeof Kinds]

type MaybeCdpError = Error & { kind?: CdpErrorKind }

export class CdpCrashedError extends Error {
  public readonly kind = Kinds.CDP_CRASHED

  public static isCdpCrashedError (error: MaybeCdpError): error is CdpCrashedError {
    return error.kind === Kinds.CDP_CRASHED
  }
}

export class CdpDisconnectedError extends Error {
  public readonly kind = Kinds.CDP_DISCONNECTED

  constructor (message: string, public readonly originalError?: Error) {
    super(message)
  }

  public static isCdpDisconnectedError (error: MaybeCdpError): error is CdpDisconnectedError {
    return error.kind === Kinds.CDP_DISCONNECTED
  }
}

export class CdpTerminatedError extends Error {
  public readonly kind = Kinds.CDP_TERMINATED

  constructor (message: string, public readonly originalError?: Error) {
    super(message)
  }

  public static isCdpTerminatedError (error: MaybeCdpError): error is CdpTerminatedError {
    return error.kind === Kinds.CDP_TERMINATED
  }
}
