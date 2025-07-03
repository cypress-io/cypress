import Button from '@cypress-design/react-button'
import React from 'react'
import events from './lib/events'
import { IconWindowCodeEditor } from '@cypress-design/react-icon'
import { FileDetails } from '@packages/types'
import cx from 'classnames'

interface Props {
  fileDetails: FileDetails
  className?: string
}

export const OpenFileInIDEButton = ({ fileDetails, className }: Props) => {
  return (<>
    <Button size='20' variant='outline-dark' className={cx('open-in-ide-button', className)} onClick={() => events.emit('open:file:unified', fileDetails)}><IconWindowCodeEditor strokeColor='gray-500' fillColor='gray-900' /> Open in IDE </Button>
    <span className={cx('button-hover-shadow')} />
  </>
  )
}
