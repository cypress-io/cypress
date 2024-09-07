import { BidiSocket } from '../sockets/bidi-socket'
import { SessionModule } from './modules/session'

export class BidiAutomation {
  session: SessionModule
  private constructor (session: SessionModule) {
    this.session = session
  }

  static async create (biDiWebSocketUrl: string): Promise<any> {
    const bidiSocket = await BidiSocket.create(biDiWebSocketUrl)

    const sessionModule = await new SessionModule(bidiSocket)
    const bidiAutomation = new BidiAutomation(sessionModule)

    return bidiAutomation
  }
}
