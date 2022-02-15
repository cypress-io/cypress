import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'

import { Alias } from '../instruments/instrument-model'
import CommandModel from './command-model'
import Command from './command'
import NoStudioCommands from './NoStudioCommands'

export interface CommandContainerProps {
  commands: Array<CommandModel>
  showStudioPrompt: boolean
  aliasesWithDuplicates: Array<Alias> | null
}

const CommandContainer = observer(({ commands, showStudioPrompt, aliasesWithDuplicates }: CommandContainerProps) => (
  <ul className='commands-container'>
    {_.map(commands, (command) => <Command key={command.id} model={command} aliasesWithDuplicates={aliasesWithDuplicates} />)}
    {showStudioPrompt && <NoStudioCommands />}
  </ul>
))

export default CommandContainer
