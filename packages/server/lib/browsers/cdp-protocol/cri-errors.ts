const Kinds = Object.freeze({
  CDP_CRASHED: 'cdp_crashed',
  CDP_DISCONNECTED: 'cdp_disconnected',
  CDP_TERMINATED: 'cdp_terminated',
  CDP_ALREADY_CONNECTED: 'cdp_already_connected',
})

type CdpErrorKind = typeof Kinds[keyof typeof Kinds]

type MaybeCdpError = Error & { kind?: CdpErrorKind }

export class CDPCrashedError extends Error {
  public readonly kind = Kinds.CDP_CRASHED

  public static isCDPCrashedError (error: MaybeCdpError): error is CDPCrashedError {
    return error.kind === Kinds.CDP_CRASHED
  }
}

export class CDPDisconnectedError extends Error {
  public readonly kind = Kinds.CDP_DISCONNECTED

  constructor (message: string, public readonly originalError?: Error) {
    super(message)
  }

  public static isCDPDisconnectedError (error: MaybeCdpError): error is CDPDisconnectedError {
    return error.kind === Kinds.CDP_DISCONNECTED
  }
}

export class CDPTerminatedError extends Error {
  public readonly kind = Kinds.CDP_TERMINATED

  constructor (message: string, public readonly originalError?: Error) {
    super(message)
  }

  public static isCDPTerminatedError (error: MaybeCdpError): error is CDPTerminatedError {
    return error.kind === Kinds.CDP_TERMINATED
  }
}

export class CDPAlreadyConnectedError extends Error {
  public readonly kind = Kinds.CDP_ALREADY_CONNECTED

  constructor (message: string, public readonly originalError?: Error) {
    super(message)
  }

  public static isCDPAlreadyConnectedError (error: MaybeCdpError): error is CDPAlreadyConnectedError {
    return error.kind === Kinds.CDP_ALREADY_CONNECTED
  }
}
