import cs from 'classnames'
import React, { CSSProperties, MouseEvent, ReactNode, RefObject, useCallback, useState } from 'react'
import { onEnterOrSpace } from '../lib/util'
import DocumentBlankIcon from '@packages/frontend-shared/src/assets/icons/document-blank_x16.svg'
import { IconChevronDownSmall } from '@cypress-design/react-icon'

export interface CollapsibleHeaderComponentProps {
  isOpen: boolean
}

interface CollapsibleProps {
  isOpen?: boolean
  headerClass?: string
  headerStyle?: CSSProperties
  header?: ReactNode
  HeaderComponent?: React.FunctionComponent<CollapsibleHeaderComponentProps>
  headerExtras?: ReactNode
  containerRef?: RefObject<HTMLDivElement>
  contentClass?: string
  hideExpander?: boolean
  children?: ReactNode
  onOpenStateChangeRequested?: (isOpen: boolean) => void
}

const Collapsible: React.FC<CollapsibleProps> = ({ isOpen: isOpenAsProp = false, header, headerClass = '', headerStyle = {}, headerExtras, contentClass = '', hideExpander = false, containerRef = null, onOpenStateChangeRequested, children, HeaderComponent }) => {
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
            {!hideExpander && headerClass === 'hook-header' && <IconChevronDownSmall size='16' strokeColor='gray-800' className='collapsible-indicator' />}
            {!hideExpander && headerClass !== 'hook-header' && <DocumentBlankIcon className='collapsible-indicator' />}
            <span className='collapsible-header-text'>
              {HeaderComponent ? <HeaderComponent isOpen={isOpen} /> : header}
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
