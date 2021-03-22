import cs from 'classnames'
import * as React from 'react'
import State from '../lib/state'
import styles from './RunnerCt.module.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { PLUGIN_BAR_HEIGHT } from './RunnerCt'
import { UIPlugin } from '../plugins/UIPlugin'
import { Hidden } from '../lib/Hidden'

interface PluginsProps {
  state: State
  pluginsHeight: number
}

export function Plugins (props: PluginsProps) {
  const ref = React.useRef<HTMLDivElement>(null)

  function handlePluginClick (plugin: UIPlugin) {
    props.state.toggleDevtoolsPlugin(plugin, ref.current)
  }

  return (
    <Hidden
      type='visual'
      hidden={!props.state.isAnyPluginToShow}
      className={styles.ctPlugins}
    >
      <div className={styles.ctPluginsHeader}>
        {props.state.plugins.map((plugin) => (
          <button
            key={plugin.name}
            onClick={() => handlePluginClick(plugin)}
            className={cs(styles.ctPluginToggleButton)}
          >
            <span className={styles.ctPluginsName}>{plugin.name}</span>
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
}
