import { nxs } from 'nexus-decorators'
import { ExecContext } from '../ExecContext'

@nxs.objectType({
  description: 'Namespace for information related to the app',
})
export class App {
  constructor (private ctx: ExecContext) {}

  @nxs.queryField(() => {
    return { type: App }
  })
  static app (_, ctx) {
    return new App(ctx)
  }

  @nxs.field.nonNull.boolean({
    description: 'Whether this is the first open of the application or not',
  })
  get isFirstOpen () {
    return true
  }
}
