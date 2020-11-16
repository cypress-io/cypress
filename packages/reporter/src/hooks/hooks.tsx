import cs from 'classnames'
import _ from 'lodash'
import { autorun } from 'mobx'
import { observer } from 'mobx-react'
import React, { useEffect } from 'react'

import { Expandable, ExpandableProps } from '../collapsible/expandable'
import { HookModel } from './hook-model'
import FileOpener from '../lib/file-opener'
import { indentPadding } from '../lib/util'

export interface HookProps {
  expandableProps: ExpandableProps
  model: HookModel
  showNumber: boolean
  style: React.CSSProperties
}

// TODO: get the showNumber part right
// TODO: after hooks need to come after test body

export const Hook = observer(({ expandableProps, model, style }: HookProps) => {
  useEffect(() => {
    const disposeAutorun = autorun(() => {
      model.commands.length
      model.hookName
      model.hookNumber

      requestAnimationFrame(() => {
        expandableProps.measure()
      })
    })

    return () => {
      disposeAutorun()
    }
  }, [true])

  if (!model.commands.length) return null

  const showNumber = model.attempt.hookCount[model.hookName] > 1
  const number = showNumber ? model.hookNumber : undefined

  return (
    <div className={cs(`hook runnable-state-${model.test.state}`, { 'hook-failed': model.failed })} style={indentPadding(style, model.test.level)}>
      <div className='hooks-container'>
        <div className='hook-item hook-header'>
          <Expandable expandableProps={expandableProps}>
            <div className='collapsible-header'>
              {model.hookName} {number && `(${number})`} <span className='hook-failed-message'>(failed)</span>
            </div>
          </Expandable>
          {model.invocationDetails && (
            <FileOpener fileDetails={model.invocationDetails} className='hook-open-in-ide'>
              <i className="fas fa-external-link-alt fa-sm" /> <span>Open in IDE</span>
            </FileOpener>
          )}
        </div>
      </div>
    </div>
  )
})
