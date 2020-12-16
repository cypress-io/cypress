// @ts-check
import * as React from 'react'
import { observer } from 'mobx-react'
import Stats from '@packages/reporter/src/header/stats'

/**
 * @type {React.FC<import("@packages/reporter/src/header/header").ReporterHeaderProps & { onCollapse: () => void }>}
 */
export const ReporterHeader = observer(
  React.forwardRef(
    function ReporterHeader ({ statsStore, onCollapse }, ref) {
      return (
        <header ref={ref}>
          <Stats stats={statsStore} />
          <div className='spacer' />
          <button onClick={onCollapse}> collapse </button>
        </header>
      )
    },
  ),
)
