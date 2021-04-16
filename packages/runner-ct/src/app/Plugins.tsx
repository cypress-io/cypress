import cs from 'classnames'
import * as React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import State from '../lib/state'
import { Hidden } from '../lib/Hidden'
import { namedObserver } from '../lib/mobx'
import { PLUGIN_BAR_HEIGHT } from './RunnerCt'

import styles from './RunnerCt.module.scss'

interface PluginsProps {
  state: State
  pluginsHeight: number
}

export const Plugins = namedObserver('Plugins',
  (props: PluginsProps) => {
    const ref = React.useRef<HTMLDivElement>(null)

    return (
      <Hidden
        type="layout"
        hidden={!props.state.isAnyPluginToShow}
        className={styles.ctPlugins}
      >
        <div className={styles.ctPluginsHeader}>
          {props.state.plugins.map((plugin) => (
            <button
              key={plugin.name}
              className={cs(styles.ctPluginToggleButton)}
              onClick={() => props.state.toggleDevtoolsPlugin(plugin, ref.current)}
            >
              <span className={styles.ctPluginsName}>
                {plugin.name}
              </span>
              <div
                className={cs(styles.ctTogglePluginsSectionButton, {
                  [styles.ctTogglePluginsSectionButtonOpen]: props.state.isAnyDevtoolsPluginOpen,
                })}
              >
                <FontAwesomeIcon
                  icon='chevron-up'
                  className={styles.ctPluginsName}
                />
              </div>
            </button>
          ))}
        </div>
        <div
          ref={ref}
          className={styles.ctPluginsContainer}
          style={{ height: props.pluginsHeight - PLUGIN_BAR_HEIGHT }}
        />
      </Hidden>
    )
  })
