import * as React from 'react'
import { observer } from 'mobx-react'
import { ReporterHeader } from './ReporterHeader'
import { Reporter } from '@packages/reporter'
import errorMessages from '../errors/error-messages'

export const BottomPane = observer(
  function BottomPane ({ state, config, onResizingEnabledChange, eventManager }) {
    const headerRef = React.useRef(null)
    const paneContainerRef = React.useRef(null)
    const [previousPaneHeight, setPreviousPaneHeight] = React.useState(null)

    const isCollapsed = previousPaneHeight !== null

    const handleCollapse = React.useCallback(() => {
      if (!headerRef.current || !paneContainerRef.current) {
        return
      }

      const paneElement = paneContainerRef.current.parentElement

      if (!paneElement) {
        throw new Error('Can not collapse, pane was not instantiated')
      }

      /** @type {(newHeight: number) => void} */
      const setPaneHeight = (newHeight) => {
        paneElement.style.height = `${newHeight}px`
      }

      if (isCollapsed) {
        onResizingEnabledChange(true)
        setPaneHeight(previousPaneHeight)
        setPreviousPaneHeight(null)
      } else {
        onResizingEnabledChange(false)
        setPreviousPaneHeight(paneElement.getBoundingClientRect().height)
        setPaneHeight(headerRef.current.getBoundingClientRect().height)
      }
    }, [previousPaneHeight])

    return (
      <div ref={paneContainerRef} className="ct-bottom-pane" style={{ height: 12 }}>
        {state.spec && (
          <Reporter
            runMode={state.runMode}
            runner={eventManager.reporterBus}
            spec={state.spec}
            allSpecs={state.multiSpecs}
            autoScrollingEnabled={config.state.autoScrollingEnabled}
            error={errorMessages.reporterError(state.scriptError, state.spec.relative)}
            firefoxGcInterval={config.firefoxGcInterval}
            resetStatsOnSpecChange={state.runMode === 'single'}
            renderHeader={(props) => (
              <ReporterHeader
                {...props}
                ref={headerRef}
                isCollapsed={isCollapsed}
                onCollapse={handleCollapse}
              />
            )}
          />
        )}
      </div>
    )
  },
)
