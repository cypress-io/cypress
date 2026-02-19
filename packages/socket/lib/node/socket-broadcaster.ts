export interface SocketBroadcaster {
  toDriver: (event: string, ...args: any[]) => void
  toRunner: (event: string, ...args: any[]) => void
}
