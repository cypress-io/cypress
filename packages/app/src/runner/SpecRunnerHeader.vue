<template>
  <div class="flex text-xs">
    <button
      data-cy="header-studio"
      :disabled="isDisabled"
    >
      Studio
    </button>

    <button
      data-cy="header-selector"
      :disabled="isDisabled"
    >
      Selector
    </button>

    <div
      v-if="props.gql.currentTestingType === 'e2e'"
      data-cy="aut-url"
    >
      <div
        class="rounded-md flex shadow-md mx-2 url px-4"
        :class="{
          'bg-yellow-50': autStore.isLoadingUrl,
          'bg-white': !autStore.isLoadingUrl,
        }"
      >
        <div>
          {{ autStore.url }}
        </div>
      </div>

      <div>Loading URL: {{ autStore.isLoadingUrl }}</div>
    </div>

    <Select
      v-model="browser"
      data-cy="select-browser"
      :options="browsers"
      item-value="name"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useAutStore } from '../store'
import Select from '@packages/frontend-shared/src/components/Select.vue'
import { gql } from '@urql/vue'
import type { SpecRunnerHeaderFragment } from '../generated/graphql'

gql`
fragment SpecRunnerHeader on App {
  currentTestingType

  currentBrowser {
    id
    displayName
  }
  browsers {
    id
    name
    displayName
  }
}
`

const props = defineProps<{
  gql: SpecRunnerHeaderFragment
}>()

const browser = computed(() => {
  if (!props.gql.currentBrowser) {
    return
  }

  const dimensions = `${autStore.viewportDimensions.width}x${autStore.viewportDimensions.height}`

  return {
    id: props.gql.currentBrowser.id,
    name: `${props.gql.currentBrowser.displayName} ${dimensions}`,
  }
})

const browsers = computed(() => props.gql.browsers?.slice() ?? [])

const autStore = useAutStore()

const isDisabled = computed(() => autStore.isRunning || autStore.isLoading)
</script>

<style scoped lang="scss">
button, .url {
  @apply flex items-center justify-center;
}

button {
  @apply rounded-md bg-white flex shadow-md ml-2;
  @apply w-20 hover:bg-gray-50;
}
</style>
