import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'

export type CdpCommand = keyof ProtocolMapping.Commands

export type CdpEvent = keyof ProtocolMapping.Events

export type SendDebuggerCommand = <T extends CdpCommand>(
  message: T,
  data?: ProtocolMapping.Commands[T]['paramsType'][0],
  sessionId?: string,
) => Promise<ProtocolMapping.Commands[T]['returnType']>

export type OnFn = <T extends CdpEvent>(
  eventName: T,
  cb: (data: ProtocolMapping.Events[T][0], sessionId?: string) => void,
) => void

export type OffFn = <T extends CdpEvent>(
  eventName: T,
  cb: (data: ProtocolMapping.Events[T][0], sessionId?: string) => void,
) => void

export type CriClientEnableCommand = {
  command: CdpCommand
  params?: object
  sessionId?: string
}

/** CDP session surface required by CDPNetworkInterception and future CDP modules. */
export interface CriClient {
  targetId: string
  send: SendDebuggerCommand
  on: OnFn
  off: OffFn
  queue: { enableCommands: CriClientEnableCommand[] }
}
