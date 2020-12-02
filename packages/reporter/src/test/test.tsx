import { observer } from 'mobx-react'
import React, { createRef, useEffect } from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import appState from '../lib/app-state'
import { TestModel } from './test-model'
import scroller from '../lib/scroller'
// import { constants } from 'react-virtualized-tree'
// import { autorun } from 'mobx'

// TODO:
// - handle scrollintoview from Attempts somehow
//   <Attempts test={model} scrollIntoView={() => this._scrollIntoView()} />
// - model.isOpen for expansion

interface TestProps {
  model: TestModel
}

export const Test = observer(({ model }: TestProps) => {
  const containerRef = createRef<HTMLDivElement>()

  const scrollIntoView = () => {
    const { state, shouldRender } = model

    if (appState.autoScrollingEnabled && appState.isRunning && shouldRender && state !== 'processing') {
      requestAnimationFrame(() => {
        // since this executes async in a RAF the ref might be null
        if (containerRef.current) {
          scroller.scrollIntoView(containerRef.current as HTMLElement)
        }
      })
    }
  }

  useEffect(() => {
    scrollIntoView()
    // requestAnimationFrame(() => {
    //   // expandableProps.measure()
    //   // expandableProps.onChange({ node: expandableProps.node, type: constants.UPDATE_TYPE.UPDATE })
    // })

    // autorun(() => {
    //   model.title
    //   model.state
    //   model.shouldRender
    //   model.hasRetried
    //   model.type
    //   model.level

    //   console.log('autorun measure')
    //   expandableProps.measure()
    // })
  }, [true])

  useEffect(() => {
    scrollIntoView()
    model.callbackAfterUpdate()
  })

  return (
    <div className='runnable-title'>
      <i aria-hidden='true' className='runnable-state fas' />
      {model.title}
      <span className='visually-hidden'>{model.state}</span>
      <span className='runnable-controls'>
        <Tooltip placement='top' title='One or more commands failed' className='cy-tooltip'>
          <i className='fas fa-exclamation-triangle' />
        </Tooltip>
      </span>
    </div>
  )
})
