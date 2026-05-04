export interface SocketBroadcaster {
  toDriver: (event: string, ...args: any[]) => void
}
