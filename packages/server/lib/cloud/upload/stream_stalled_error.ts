export const StreamStalledErrorKind = 'StreamStalled'

export class StreamStalledError extends Error {
  public readonly kind = StreamStalledErrorKind

  constructor (
    public readonly maxActivityDwellTime: number,
    public readonly chunkSizeBytes: number,
  ) {
    super(`Stream stalled: failed to transfer ${chunkSizeBytes} bytes over the previous ${maxActivityDwellTime}ms`)
  }

  public static isStreamStalledError (error: Error & {kind?: any}): error is StreamStalledError {
    return error.kind === StreamStalledErrorKind
  }
}
