import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { useDeferredValue, useState, useEffect, useRef } from 'react'
import appState, { AppState } from '../lib/app-state'
import Command from '../commands/command'
import Collapsible from '../collapsible/collapsible'
import type HookModel from './hook-model'
import type { HookName } from './hook-model'
import type CommandModel from '../commands/command-model'
import { OpenFileInIDEButton } from '../header/OpenFileInIDEButton'
import scroller from '../lib/scroller'

export interface HookHeaderProps {
  model: HookModel
  number?: number
}

const HookHeader = ({ model, number }: HookHeaderProps) => (
  <span className='hook-name' data-cy={`hook-name-${model.hookName}`}>
    {model.hookName} {number && `(${number})`}
    {model.failed && <span className='hook-failed-message'> (failed)</span>}
  </span>
)

// Commands per frame to render incrementally
const COMMANDS_PER_FRAME = 50

// Hook to render commands incrementally to prevent UI hangs when many commands
// are added rapidly. Uses requestAnimationFrame to batch renders.
const useDeferredCommands = (commands: CommandModel[]): CommandModel[] => {
  const [renderedCount, setRenderedCount] = useState(0)
  // Guard against undefined/null commands
  const safeCommands = commands || []
  const deferredCommands = useDeferredValue(safeCommands)
  const rafRef = useRef<number | null>(null)
  const lastCommandsLengthRef = useRef(safeCommands.length)
  const isRenderingRef = useRef(false)

  useEffect(() => {
    // Reset rendered count when commands array length decreases
    if (safeCommands.length < lastCommandsLengthRef.current) {
      setRenderedCount(0)
    }

    lastCommandsLengthRef.current = safeCommands.length

    // If we've already rendered all commands, no need to continue
    if (renderedCount >= safeCommands.length || isRenderingRef.current) {
      return
    }

    // Cancel any pending animation frame
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }

    isRenderingRef.current = true

    const renderNextBatch = () => {
      setRenderedCount((currentCount) => {
        // Always check the current commands length in case new commands were added
        const targetLength = lastCommandsLengthRef.current
        const nextCount = Math.min(currentCount + COMMANDS_PER_FRAME, targetLength)

        // If there are more commands to render, schedule another frame
        if (nextCount < targetLength) {
          rafRef.current = requestAnimationFrame(renderNextBatch)
        } else {
          isRenderingRef.current = false
        }

        return nextCount
      })
    }

    // Start rendering on next frame
    rafRef.current = requestAnimationFrame(renderNextBatch)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }

      isRenderingRef.current = false
    }
    // Only depend on commands.length - the renderNextBatch callback will handle incremental updates
  }, [commands?.length ?? 0])

  // Return subset of commands that should be rendered
  // Always render at least the first command immediately if commands exist
  const countToRender = safeCommands.length > 0 && renderedCount === 0
    ? 1
    : renderedCount

  return deferredCommands.slice(0, countToRender)
}

export interface HookProps {
  model: HookModel
  showNumber: boolean
  scrollIntoView: Function
}

const Hook: React.FC<HookProps> = observer(({ model, showNumber, scrollIntoView }: HookProps) => {
  const renderedCommands = useDeferredCommands(model.commands)
  const lastRenderedCountRef = useRef(0)

  // Scroll to end after each batch of commands is rendered
  useEffect(() => {
    // Reset ref when commands are cleared (e.g., test rerun)
    if (renderedCommands.length < lastRenderedCountRef.current) {
      lastRenderedCountRef.current = 0
    }

    // Only scroll if new commands were rendered
    if (renderedCommands.length > lastRenderedCountRef.current) {
      lastRenderedCountRef.current = renderedCommands.length

      // Use requestAnimationFrame to ensure DOM is fully updated before scrolling
      requestAnimationFrame(() => {
        scroller.scrollToEnd()
      })
    }
  }, [renderedCommands.length])

  return (
    <li className={cs('hook-item', { 'hook-failed': model.failed })}>
      <Collapsible
        header={
          <>
            <HookHeader model={model} number={showNumber ? model.hookNumber : undefined} />
            {model.invocationDetails && Cypress.testingType !== 'component' && (
              <span onClick={(e) => e.stopPropagation()}>
                <OpenFileInIDEButton fileDetails={model.invocationDetails} className='hook-open-in-ide' />
              </span>
            )}
          </>
        }
        headerClass='hook-header'
        isOpen
      >
        <ul className='commands-container'>
          {_.map(renderedCommands, (command) => (
            <Command
              key={command.id}
              model={command}
              aliasesWithDuplicates={model.aliasesWithDuplicates}
              scrollIntoView={scrollIntoView}
            />
          ))}
        </ul>
      </Collapsible>
    </li>
  )
})

Hook.displayName = 'Hook'

export interface HooksModel {
  hooks: HookModel[]
  hookCount: { [name in HookName]: number }
  state: string
}

export interface HooksProps {
  state?: AppState
  model: HooksModel
  scrollIntoView: Function
}

const Hooks: React.FC<HooksProps> = observer(({ state = appState, model, scrollIntoView }: HooksProps) => (
  <ul className='hooks-container'>
    {_.map(model.hooks, (hook) => {
      if (hook.commands.length && hook.hookName !== 'studio commands') {
        return <Hook key={hook.hookId} model={hook} scrollIntoView={scrollIntoView} showNumber={model.hookCount[hook.hookName] > 1} />
      }

      return null
    })}
  </ul>
))

Hooks.displayName = 'Hooks'

export { Hook, HookHeader }

export default Hooks
