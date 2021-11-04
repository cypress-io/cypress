import { registerMountFn, addVueCommand, installCustomPercyCommand } from './common'
import '../../src/styles/shared.scss'
import 'virtual:windi.css'

installCustomPercyCommand()
registerMountFn()
addVueCommand()
