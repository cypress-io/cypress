import { registerMountFn, addVueCommand } from './common'
import '../../src/styles/shared.scss'
import 'virtual:windi.css'
import installCustomPercyCommand from '@packages/ui-components/cypress/support/customPercyCommand'
import { addNetworkCommands } from './onlineNetwork'

registerMountFn()
addVueCommand()
installCustomPercyCommand()
addNetworkCommands()
