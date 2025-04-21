import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Children, cloneElement, MouseEvent, ReactElement, ReactNode, useCallback, useState } from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

interface Props {
  message: string
  onClick: ((e: MouseEvent) => void)
  shouldShowMessage?: (() => boolean)
  wrapperClassName?: string
  children: React.ReactNode
}

const FlashOnClick: React.FC<Props> = observer(({ message, onClick, wrapperClassName, children, shouldShowMessage = () => true }) => {
  const [show, setShow] = useState(false)

  const _onClick = useCallback((e: MouseEvent) => {
    onClick(e)
    if (shouldShowMessage && !shouldShowMessage()) return

    setShow(true)
    setTimeout(action('hide:console:message', () => {
      setShow(false)
    }), 1500)
  }, [onClick, shouldShowMessage])

  const child = Children.only<ReactNode>(children)

  return (
    <Tooltip
      placement='top'
      title={message}
      visible={show}
      className='cy-tooltip'
      wrapperClassName={wrapperClassName}
    >
      {cloneElement(child as ReactElement, { onClick: _onClick })}
    </Tooltip>
  )
})

FlashOnClick.displayName = 'FlashOnClick'
export default FlashOnClick
