import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import { List, ListRowProps } from 'react-virtualized'

import Command from '../commands/command'
import Collapsible from '../collapsible/collapsible'
import HookModel from './hook-model'

export interface HookHeaderProps {
  name: string
}

const HookHeader = ({ name }: HookHeaderProps) => (
  <span>
    {name} <span className='hook-failed-message'>(failed)</span>
  </span>
)

export interface HookProps {
  useAlternativeAutoScroll: boolean
  model: HookModel
}

const Hook = observer(({ useAlternativeAutoScroll, model }: HookProps) => (
  <div className={cs('hook-item', { 'hook-failed': model.failed })}>
    <Collapsible
      header={<HookHeader name={model.name} />}
      headerClass='hook-name'
      isOpen={true}
    >
      {useAlternativeAutoScroll ? renderWindowedAutoScroll(model) : renderOriginalAutoScroll(model)}
    </Collapsible>
  </div>
))

const renderOriginalAutoScroll = (model: HookModel) => (
  <ul className='commands-container' >
    { _.map(model.commands, (command) => <Command key={command.id} model={command} aliasesWithDuplicates={model.aliasesWithDuplicates} />) }
  </ul>
)

const renderWindowedAutoScroll = (model: HookModel) => (
  <List
    className='commands-container'
    height={600}
    rowCount={model.commands.length}
    rowHeight={21}
    rowRenderer={renderRow(model)}
    scrollToIndex={model.commands.length - 1}
    width={600}
  />
)

const renderRow = (model: HookModel) =>
  ({ index, style }: ListRowProps) =>
    <Command key={model.commands[index].id} model={model.commands[index]} aliasesWithDuplicates={model.aliasesWithDuplicates} style={style} />

export interface HooksModel {
  hooks: Array<HookModel>
}

export interface HooksProps {
  model: HooksModel
}

const Hooks = observer(({ model }: HooksProps) => (
  <ul className='hooks-container'>
    {_.map(model.hooks, (hook) => <Hook key={hook.id} model={hook} useAlternativeAutoScroll={true} />)}
  </ul>
))

export { Hook, HookHeader }

export default Hooks
