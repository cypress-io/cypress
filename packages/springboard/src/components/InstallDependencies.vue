<template>
  <div class="flex flex-col items-center">
    <div class="max-w-screen-sm">
      <div>
        <p class="text-center p-4 text-xl">
          We need you to install these dev dependencies.
        </p>

        <ul>
          <DependencyItem
            v-for="dependency of dependencies"
            :key="dependency.packageName"
            :dependency="dependency"
          />
        </ul>
      </div>
    </div>
    <p class="text-lg m-4">Run this command in your terminal:</p>
    <TerminalCommand :command="command" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
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

    const installCommand = computed(() => {
      const type = store.getState().component.packageManager.type
      if (type === 'yarn') {
        return 'yarn add'
      }

      return 'npm install'
    })

    // TODO: We should detect whether they are using npm or yarn.
    const command = `${installCommand.value} ${framework.dependencies.map(dep => dep.packageName).join(' ')} --dev`

    return {
      dependencies: framework.dependencies,
      command
    }
  }
})
</script>