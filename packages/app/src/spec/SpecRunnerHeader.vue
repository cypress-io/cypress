<template>
  <div class="flex text-xs">
    <button :disabled="isDisabled">
      Studio
    </button>

    <button :disabled="isDisabled">
      Selector
    </button>

    <div class="rounded-md bg-white flex shadow-md mx-2 url px-4">
      URL: {{ autStore.url }}
    </div>

    <Select
      v-model="browser"
      :options="browsers"
      item-value="name"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useAutStore } from '../store';
import Select from '@packages/frontend-shared/src/components/Select.vue'
import { gql } from '@urql/vue'
import type { SpecRunnerHeaderFragment } from '../generated/graphql';

gql`
fragment SpecRunnerHeader on App {
  selectedBrowser {
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
  if (!props.gql.selectedBrowser) {
    return 
  }

  const dimensions = `${autStore.viewportDimensions.width}x${autStore.viewportDimensions.height}`

  return {
    id: props.gql.selectedBrowser.id,
    name: `${props.gql.selectedBrowser.displayName} ${dimensions}`
  }
})

const browsers = computed(() => props.gql.browsers?.slice() ?? [])

const autStore = useAutStore()

const isDisabled = computed(() => autStore.isRunning || autStore.isLoading)
</script>

<style scoped lang="scss">
button, .url {
  @apply rounded-md bg-white flex shadow-md ml-2;
  @apply flex items-center justify-center;
}

button {
  @apply w-20 hover:bg-gray-50;
}
</style>
