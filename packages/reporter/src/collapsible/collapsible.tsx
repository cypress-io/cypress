import cs from 'classnames'
import React, { CSSProperties, MouseEvent, ReactNode, RefObject, useCallback, useState } from 'react'
import { onEnterOrSpace } from '../lib/util'
import ChevronIcon from '@packages/frontend-shared/src/assets/icons/chevron-down-small_x8.svg'

interface CollapsibleProps {
  isOpen?: boolean
  headerClass?: string
  headerStyle?: CSSProperties
  header?: ReactNode
  headerExtras?: ReactNode
  containerRef?: RefObject<HTMLDivElement>
  contentClass?: string
  hideExpander?: boolean
  children?: ReactNode
  onOpenStateChangeRequested?: (isOpen: boolean) => void
}

const Collapsible: React.FC<CollapsibleProps> = ({ isOpen: isOpenAsProp = false, header, headerClass = '', headerStyle = {}, headerExtras, contentClass = '', hideExpander = false, containerRef = null, onOpenStateChangeRequested, children }) => {
  const [isOpenState, setIsOpenState] = useState(isOpenAsProp)

  const toggleOpenState = useCallback((e?: MouseEvent) => {
    e?.stopPropagation()
    if (onOpenStateChangeRequested) {
      onOpenStateChangeRequested(!isOpen)
    } else {
      setIsOpenState(!isOpen)
    }
  }, [isOpenState, onOpenStateChangeRequested])

  const isOpen = onOpenStateChangeRequested ? isOpenAsProp : isOpenState

  return (
    <div className={cs('collapsible', { 'is-open': isOpen })} ref={containerRef}>
      <div className={cs('collapsible-header-wrapper', headerClass)}>
        <div
          aria-expanded={isOpen}
          className='collapsible-header'
          onClick={toggleOpenState}
          onKeyUp={onEnterOrSpace(toggleOpenState)}
          role='button'
          tabIndex={0}
        >
          <div
            className='collapsible-header-inner'
            style={headerStyle}
            tabIndex={-1}
          >
            {!hideExpander && <ChevronIcon className='collapsible-indicator' />}
            <span className='collapsible-header-text'>
              {header}
            </span>
          </div>
        </div>
        {headerExtras}
      </div>
      {isOpen && (
        <div className={cs('collapsible-content', contentClass)}>
          {children}
        </div>
      )}
    </div>
  )
}

export default Collapsible
