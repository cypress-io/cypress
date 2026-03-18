import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import cs from 'classnames'

import Tooltip from '@cypress/react-tooltip'
import Button from '@cypress-design/react-button'
import { IconActionAddMedium, IconWindowCodeEditor, IconMenuDotsVertical } from '@cypress-design/react-icon'
import defaultEvents, { Events } from '../lib/events'
import Switch from '../lib/switch'
import appState from '../lib/app-state'

interface Props {
  events?: Events
  spec: Cypress.Cypress['spec']
}

export const RunnablePopoverOptions: React.FC<Props> = observer(({
  events = defaultEvents,
  spec,
}: Props) => {
  const relativeSpecPath = spec.relative

  const isStudioSingleTest = appState?.studioActive && appState.studioSingleTestActive

  const fileDetails = {
    absoluteFile: spec.absolute,
    column: 0,
    displayFile: spec.name,
    line: 0,
    originalFile: relativeSpecPath,
    relativeFile: relativeSpecPath,
  }

  const [isOpen, setIsOpen] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonContainerRef = useRef<HTMLDivElement>(null)

  const togglePopover = () => {
    if (!isOpen && buttonContainerRef.current) {
      const rect = buttonContainerRef.current.getBoundingClientRect()

      setPopoverPosition({
        top: rect.bottom + 4,
        left: rect.right - 250, // 250px is the popover width
      })
    }

    setIsOpen(!isOpen)
  }

  const handleOpenInIDE = () => {
    events.emit('open:file:unified', fileDetails)
    setIsOpen(false)
  }

  const getSuiteIdForNewTest = (): string => {
    const test = Cypress.state('test')
    const parent = test && test?.parent

    let suiteId = 'r1'

    if (isStudioSingleTest) {
      if (parent && parent.id && parent.type === 'suite') {
        suiteId = parent.id
      }
    }

    return suiteId
  }

  const handleNewTest = () => {
    const suiteId = getSuiteIdForNewTest()

    events.emit('studio:init:suite', { suiteId, entrySource: suiteId === 'r1' ? 'new-test-root' : 'new-test-suite' })
    setIsOpen(false)
  }

  const toggleAutoScrollingUserPref = () => {
    appState.toggleAutoScrollingUserPref()
    events.emit('save:state')
  }

  const toggleShowFetchRequests = () => {
    appState.toggleShowFetchRequests()
    events.emit('save:state')
  }

  const toggleCodeEditorLineWrap = () => {
    appState.toggleCodeEditorLineWrap()
    events.emit('save:state')
  }

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        buttonContainerRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonContainerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('scroll', handleScroll, true)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  const popoverContent = isOpen && (
    <div
      ref={popoverRef}
      className="runnable-popover"
      data-cy="more-options-runnable-popover"
      style={{
        top: `${popoverPosition.top}px`,
        left: `${popoverPosition.left}px`,
      }}
    >
      <div className="runnable-popover-section">
        <div className="runnable-popover-section-title">This spec</div>

        <button
          className="runnable-popover-item"
          onClick={handleOpenInIDE}
          data-cy="runnable-popover-open-ide"
        >
          <IconWindowCodeEditor strokeColor="gray-500" fillColor="gray-500" />
          <span>Open in IDE</span>
        </button>

        <button
          className="runnable-popover-item"
          onClick={handleNewTest}
          data-cy="runnable-popover-new-test"
        >
          <IconActionAddMedium strokeColor="gray-500" />
          <span>New test</span>
        </button>
      </div>

      <div className="runnable-popover-section">
        <div className="runnable-popover-section-title">Testing preferences</div>

        <div className="runnable-popover-item-with-toggle">
          <div className="runnable-popover-item-with-toggle-content">
            <div className="runnable-popover-item-text">
              <span className="runnable-popover-item-label">Show HTTP requests</span>
            </div>
            <Switch
              data-cy="show-http-requests-switch"
              value={appState.showFetchRequests}
              onUpdate={action('toggle:show:http:requests', toggleShowFetchRequests)}
            />
          </div>
        </div>

        <div className="runnable-popover-item-with-toggle">
          <div className="runnable-popover-item-with-toggle-content">
            <div className="runnable-popover-item-text">
              <span className="runnable-popover-item-label">Auto-scrolling</span>
            </div>
            <Switch
              data-cy="auto-scroll-switch"
              value={appState.autoScrollingUserPref}
              onUpdate={action('toggle:auto:scrolling', toggleAutoScrollingUserPref)}
            />
          </div>
          <span className="runnable-popover-item-description">
              Automatically scroll the command log while the tests are running.
          </span>
        </div>

      </div>

      <div className="runnable-popover-section">
        <div className="runnable-popover-section-title">Studio preferences</div>
        <div className="runnable-popover-item-with-toggle">
          <div className="runnable-popover-item-with-toggle-content">
            <div className="runnable-popover-item-text">
              <span className="runnable-popover-item-label">Code editor line wrap</span>
            </div>
            <Switch
              data-cy="code-editor-line-wrap-switch"
              value={appState.codeEditorLineWrap}
              onUpdate={action('toggle:code:editor:line:wrap', toggleCodeEditorLineWrap)}
            />
          </div>
          <span className="runnable-popover-item-description">
            Wrap long lines instead of scrolling horizontally.
          </span>
        </div>
      </div>
    </div>
  )

  const buttonComponent = () => (
    <div>
      <Button
        size="32"
        variant="outline-indigo"
        aria-label="Options"
        aria-expanded={isOpen}
        data-cy="runnable-options-button"
        onClick={togglePopover}
        className={cs('runnable-options-button', {
          'runnable-options-button-border': !isOpen,
        })}
      >
        <IconMenuDotsVertical className='runnable-options-button-icon' />
      </Button>
    </div>
  )

  return (
    <>
      <div className="runnable-popover-container" ref={buttonContainerRef}>
        {
          isOpen ? buttonComponent() : (
            <Tooltip placement='bottom' title={<p>Options</p>} className='cy-tooltip'>
              {buttonComponent()}
            </Tooltip>
          )
        }
      </div>
      {isOpen && createPortal(popoverContent, document.body)}
    </>
  )
})
