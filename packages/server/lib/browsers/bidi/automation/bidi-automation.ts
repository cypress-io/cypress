import { BidiSocket } from '../sockets/bidi-socket'
import { BrowsingContextModule } from './modules/browsing-context'
import { InputModule } from './modules/input'
import { LogModule } from './modules/log'
import { NetworkModule } from './modules/network'
import { ScriptModule } from './modules/script'
import { SessionModule } from './modules/session'
import { StorageModule } from './modules/storage'

export class BidiAutomation {
  browsingContext: BrowsingContextModule
  input: InputModule
  log: LogModule
  network: NetworkModule
  session: SessionModule
  script: ScriptModule
  storage: StorageModule

  private constructor ({
    browsingContextModule,
    inputModule,
    logModule,
    networkModule,
    sessionModule,
    scriptModule,
    storageModule,
  }: {
    browsingContextModule: BrowsingContextModule
    inputModule: InputModule
    logModule: LogModule
    networkModule: NetworkModule
    sessionModule: SessionModule
    scriptModule: ScriptModule
    storageModule: StorageModule
  }) {
    this.browsingContext = browsingContextModule
    this.input = inputModule
    this.log = logModule
    this.network = networkModule
    this.session = sessionModule
    this.script = scriptModule
    this.storage = storageModule
  }

  static async create (biDiWebSocketUrl: string): Promise<any> {
    const bidiSocket = await BidiSocket.create(biDiWebSocketUrl)

    // TODO: need to do some type of memory cleanup by destroying the registered events in the event emitter via off or something
    const browsingContextModule = new BrowsingContextModule(bidiSocket)
    const inputModule = new InputModule(bidiSocket)
    const logModule = new LogModule(bidiSocket)
    const networkModule = new NetworkModule(bidiSocket)
    const sessionModule = new SessionModule(bidiSocket)
    const scriptModule = new ScriptModule(bidiSocket)
    const storageModule = new StorageModule(bidiSocket)

    const bidiAutomation = new BidiAutomation({
      browsingContextModule,
      inputModule,
      logModule,
      networkModule,
      sessionModule,
      scriptModule,
      storageModule,
    })

    return bidiAutomation
  }
}
