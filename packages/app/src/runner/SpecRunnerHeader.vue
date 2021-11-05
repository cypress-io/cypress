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
      @click="showPlayground"
    >
      Selector
    </button>

    <div
      v-if="props.gql.activeTestingType === 'e2e'"
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

    <SelectorPlayground 
      v-if="selectorPlaygroundStore.show" 
      :aut-iframe="autIframe"
      :event-manager="eventManager"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useAutStore } from '../store'
import Select from '@packages/frontend-shared/src/components/Select.vue'
import { gql } from '@urql/vue'
import type { SpecRunnerHeaderFragment } from '../generated/graphql'
import SelectorPlayground from './selector-playground/SelectorPlayground.vue'
import { getAutIframeModel, getEventManager } from '.'
import { useSelectorPlaygroundStore } from '../store/selector-playground-store'

gql`
fragment SpecRunnerHeader on App {
  activeTestingType

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

const eventManager = getEventManager()
const autIframe = getAutIframeModel()


const selectorPlaygroundStore = useSelectorPlaygroundStore()

const showPlayground = () => {
  selectorPlaygroundStore.setShow(!selectorPlaygroundStore.show)
  // window.UnifiedRunner.selectorPlaygroundModel.toggleOpen()
  console.log('activated', !selectorPlaygroundStore.isEnabled)
  autIframe.toggleSelectorPlayground(!selectorPlaygroundStore.isEnabled)

  // const p = document.querySelector('#play')!
  // const playground = window.UnifiedRunner.React.createElement(window.UnifiedRunner.SelectorPlayground, {
  //   eventManager,
  //   model: window.UnifiedRunner.selectorPlaygroundModel,
  // })

  // window.UnifiedRunner.ReactDOM.render(playground, p)

  // window.UnifiedRunner.selectorPlaygroundModel.toggleOpen()
}

// window.UnifiedRunner.MobX.observe(
//   // @ts-ignore
//   window.UnifiedRunner.selectorPlaygroundModel, 'isEnabled',
//   (enabled) => {
//     autIframe.toggleSelectorPlayground(enabled)
//   }
// )

const browser = computed(() => {
  if (!props.gql.selectedBrowser) {
    return
  }

  const dimensions = `${autStore.viewportDimensions.width}x${autStore.viewportDimensions.height}`

  return {
    id: props.gql.selectedBrowser.id,
    name: `${props.gql.selectedBrowser.displayName} ${dimensions}`,
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
