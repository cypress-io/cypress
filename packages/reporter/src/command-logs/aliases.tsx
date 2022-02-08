import _ from 'lodash'
import cs from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import { Alias, AliasObject } from '../instruments/instrument-model'

import CommandModel from './command-model'

const shouldShowCount = (aliasesWithDuplicates: Array<Alias> | null, aliasName: Alias, aliasType: string | null | undefined) => {
  if (aliasType !== 'route') {
    return false
  }

  return _.includes(aliasesWithDuplicates, aliasName)
}

interface AliasReferenceProps {
  aliasObj: AliasObject
  aliasType: string | null | undefined
  aliasesWithDuplicates: Array<Alias> | null
}

const AliasReference = observer(({ aliasObj, aliasType, aliasesWithDuplicates }: AliasReferenceProps) => {
  const showCount = shouldShowCount(aliasesWithDuplicates, aliasObj.name, aliasType)

  let tooltipMessage = `Found an alias for: '${aliasObj.name}'`

  if (showCount) {
    tooltipMessage = `Found ${aliasObj.ordinal} alias for: '${aliasObj.name}'`
  }

  return (
    <span className="command-alias-container" key={aliasObj.name + aliasObj.cardinal}>
      <Tooltip placement='top' title={tooltipMessage} className={cs('cy-tooltip')}>
        <span>
          <span className={cs('command-alias', aliasType, { 'show-count': showCount })}>@{aliasObj.name}</span>
          {showCount && <span className={cs('command-alias-count')}>{aliasObj.cardinal}</span>}
        </span>
      </Tooltip>
    </span>
  )
})

interface AliasesReferencesProps {
  model: CommandModel
  aliasesWithDuplicates: Array<Alias> | null
}

const AliasesReferences = observer(({ model, aliasesWithDuplicates }: AliasesReferencesProps) => {
  console.log(model.referencesAlias)

  return (
    <span>
      {_.map(([] as Array<AliasObject>).concat((model.referencesAlias as AliasObject)), (aliasObj) => (
        <AliasReference aliasObj={aliasObj} aliasType={model.aliasType} aliasesWithDuplicates={aliasesWithDuplicates} />
      ))}
    </span>
  )
})

interface AliasesProps {
  isOpen: boolean
  model: CommandModel
  aliasesWithDuplicates: Array<Alias> | null
}

const Aliases = observer(({ model, aliasesWithDuplicates, isOpen }: AliasesProps) => {
  if (!model.alias || model.aliasType === 'route') return null

  return (
    <span>
      {_.map(([] as Array<Alias>).concat(model.alias), (alias) => {
        const aliases = [alias]

        if (!isOpen && model.hasChildren) {
          aliases.push(..._.compact(model.children.map((dupe) => dupe.alias)))
        }

        return (
          <Tooltip key={alias} placement='top' title={`${model.displayMessage} aliased as: ${aliases.map((alias) => `'${alias}'`).join(', ')}`} className='cy-tooltip'>
            <span className={cs('command-alias', `${model.aliasType}`, { 'show-count': shouldShowCount(aliasesWithDuplicates, alias, model.aliasType) })}>
              {aliases.join(', ')}
            </span>
          </Tooltip>
        )
      })}
    </span>
  )
})

export { Aliases, AliasesReferences }
