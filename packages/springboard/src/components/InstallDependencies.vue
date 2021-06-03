<template>
  <div>
    <p>
      Time to install dependencies.
      You need these ones:

      <ul class="list-disc list-inside">
        <li 
          v-for="dep of dependencies"
          :key="dep"
        >
          {{ dep }}
        </li>
      </ul>

    </p>

    <p>
      Just run <code>npm install {{ dependencies.join(', ') }}
      and you are ready to go!</code>
    </p>
  </div>
</template>

<script lang="ts">
import { useStore } from '../store'
import { defineWizardStep } from '../wizards/shared'

export default defineWizardStep({
  setup() {
    const store = useStore()

    const framework = store.getState().component.framework
    if (!framework) {
      throw Error(`store.state.component.framework must be set before using this component. This should never happen.`)
    }

    return {
      dependencies: framework.dependencies
    }
  }
})
</script>