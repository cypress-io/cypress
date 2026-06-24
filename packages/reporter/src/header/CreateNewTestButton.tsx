import Button from '@cypress-design/react-button'
import { IconActionAddMedium } from '@cypress-design/react-icon'
import React, { MouseEvent, useCallback } from 'react'
import events from '../lib/events'
import cs from 'classnames'

export const CreateNewTestButton = ({ suiteId, dataCy }: { suiteId: string, dataCy?: string }) => {
  const _launchStudio = useCallback((e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    events.emit('studio:init:suite', { suiteId, entrySource: 'new-test-suite' })
  }, [events, suiteId])

  return (
    <Button data-cy={dataCy} size='20' onClick={_launchStudio} variant='outline-dark' className={cs('launch-studio-button')} >
      <IconActionAddMedium strokeColor='gray-500' />
      New Test
    </Button>
  )
}
