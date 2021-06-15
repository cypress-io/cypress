import React from 'react'
import { DependencyItem } from './DependencyItem'
import { TerminalCommand } from './TerminalCommand'
import type { Dependency } from '../types/supportedFrameworks'

interface InstallDependenciesProps {
  dependencies: Dependency[]
}

export const InstallDependencies: React.FC<InstallDependenciesProps> = (
  props,
) => {
  return (
    <div className="flex flex-col items-center">
      <div className="max-w-screen-sm">
        <div>
          <p className="text-center p-4 text-xl">
            We need you to install these dev dependencies.
          </p>

          <ul>
            {props.dependencies.map((dependency) => (
              <DependencyItem
                key={dependency.packageName}
                dependency={dependency}
              />
            ))}
          </ul>
        </div>
      </div>
      <p className="text-lg m-4">Run this command in your terminal:</p>
      <TerminalCommand command="command" />
    </div>
  )
}

{
  /* <script lang="ts">
import { defineComponent } from 'vue'
import { useStore } from '../store'
import DependencyItem from './DependencyItem.vue'
import TerminalCommand from './TerminalCommand.vue'

export default defineComponent({
  components: {
    DependencyItem,
    TerminalCommand
  },

  setup() {
    const store = useStore()

    const framework = store.getState().component.framework
    if (!framework) {
      throw Error(`store.state.component.framework must be set before using this component. This should never happen.`)
    }

    // TODO: We should detect whether they are using npm or yarn.
    const command = `yarn add ${framework.dependencies.map(dep => dep.packageName).join(' ')} --dev`

    return {
      dependencies: framework.dependencies,
      command
    }
  }
})
</script> */
}
