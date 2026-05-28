import cs from 'classnames'
import React, { CSSProperties, MouseEvent, ReactNode, RefObject, useCallback, useEffect, useRef, useState } from 'react'
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
  const headerRef = useRef<HTMLDivElement>(null)
  const fixedElementRef = useRef<HTMLDivElement>(null)

  const toggleOpenState = useCallback((e?: MouseEvent) => {
    e?.stopPropagation()
    if (onOpenStateChangeRequested) {
      onOpenStateChangeRequested(!isOpen)
    } else {
      setIsOpenState(!isOpen)
    }
  }, [isOpenState, onOpenStateChangeRequested])

  const isOpen = onOpenStateChangeRequested ? isOpenAsProp : isOpenState

  const toggleHeaderShadow = (entries) => {
    const [entry] = entries

    headerRef.current?.classList.toggle('shadow-active', !entry.isIntersecting)
  }

  useEffect(() => {
    if (!fixedElementRef?.current) return

    const observer = new IntersectionObserver(toggleHeaderShadow)

    observer.observe(fixedElementRef.current)

    return () => observer.disconnect()
  }, [])

  return (
    <div className={cs('collapsible', { 'is-open': isOpen })} ref={containerRef}>
      {/* This empty div acts as an intersection observer target to toggle the header shadow based on scroll position */}
      <div ref={fixedElementRef}/>
      <div className={cs('collapsible-header-wrapper', headerClass)} ref={headerRef}>
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
