import cs from 'classnames'
import * as React from 'react'
import State from '../lib/state'
import { Hidden } from '../lib/Hidden'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import styles from './RunnerCt.module.scss'
import { observer } from 'mobx-react'
import { PLUGIN_BAR_HEIGHT } from './RunnerCt'
import { UIPlugin } from '../plugins/UIPlugin'

interface PluginsProps {
  state: State
  pluginsHeight: number
  pluginRootContainer: React.MutableRefObject<HTMLDivElement>
}

export const Plugins = observer(
  function Plugins (props: PluginsProps) {
    function onClick (plugin: UIPlugin) {
      return props.state.openDevtoolsPlugin(plugin)
    }

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
              onClick={() => onClick(plugin)}
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

        <Hidden
          type="layout"
          ref={props.pluginRootContainer}
          className={styles.ctPluginsContainer}
          // deal with jumps when inspecting element
          hidden={!props.state.isAnyDevtoolsPluginOpen}
          style={{ height: props.pluginsHeight - PLUGIN_BAR_HEIGHT }}
        />
      </Hidden>
    )
  },
)
