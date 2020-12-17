// @ts-check
import * as React from 'react'
import cs from 'classnames'
import { observer } from 'mobx-react'
import Stats from '@packages/reporter/src/header/stats'
import { CollapseIcon } from './CollapseIcon'

/**
 * @type {React.FC<import("@packages/reporter/src/header/header").ReporterHeaderProps & { isCollapsed: boolean, onCollapse: () => void }>}
 */
export const ReporterHeader = observer(
  React.forwardRef(
    function ReporterHeader ({ statsStore, isCollapsed, onCollapse }, ref) {
      return (
        <header ref={ref}>
          <Stats stats={statsStore} />
          <div className='spacer' />
          <button
            onClick={onCollapse}
            className={cs('collapse-reporter-btn', {
              collapsed: isCollapsed,
            })}
          >
            <CollapseIcon /> {isCollapsed ? 'open' : 'close'}
          </button>
        </header>
      )
    },
  ),
)
