<template>
  <div
    id="selector-playground"
    class="flex items-center bg-white"
  >
    <button
      :class="{ 'bg-blue-100': selectorPlaygroundStore.isEnabled }"
      class="rounded-md px-8px h-full"
      data-cy="playground-toggle"
      @click="toggleEnabled"
    >
      <Icon
        :icon="IconCursorDefaultOutline"
        height="18px"
        width="18px"
      />
    </button>

    <div
      class="flex flex-1 mx-2 h-full items-center"
      @mouseover="setShowingHighlight"
    >
      <Select
        :options="methods"
        item-value="display"
        data-cy="playground-method"
        :model-value="{
          value: selectorPlaygroundStore.method,
          display: `cy.${selectorPlaygroundStore.method}`
        }"
        class="w-120px"
        @update:model-value="({ value }) => selectorPlaygroundStore.setMethod(value)"
      />

      <span class="mx-5px">('</span>
      <input
        ref="copyText"
        v-model="selector"
        class="flex-1 rounded-md py-8px border border-gray-500 px-1 pl-4 text-blue-500"
        data-cy="playground-selector"
      >
      ')
    </div>

    <div
      data-cy="playground-num-elements"
      class="rounded-md bg-gray-400 text-white mx-1 px-3 h-full flex items-center"
    >
      {{ selectorPlaygroundStore.numElements }}
    </div>

    <div class="rounded-md border border-1 border-gray-500 flex items-center h-full divide-x-1 divide-gray-500 mr-10px">
      <button
        data-cy="playground-copy"
        class="h-full px-8px"
        @click="copySelector"
      >
        <Icon :icon="IconCopy" />
      </button>

      <button
        data-cy="playground-print"
        class="h-full px-8px"
        @click="printSelected"
      >
        <Icon :icon="IconConsoleLine" />
      </button>
    </div>

    <a
      class="flex items-center text-blue-500"
      href="https://on.cypress.io/selector-playground"
      target="_blank"
      rel="noreferrer"
    >
      <span class="mr-5px">
        <Icon :icon="IconHelpCircle" />
      </span>
      Learn more
    </a>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useSelectorPlaygroundStore } from '../../store/selector-playground-store'
import type { AutIframe } from '../aut-iframe'
import type { EventManager } from '../event-manager'
import IconCopy from '~icons/mdi/content-copy'
import Icon from '@packages/frontend-shared/src/components/Icon.vue'
import IconCursorDefaultOutline from '~icons/mdi/cursor-default-outline'
import IconHelpCircle from '~icons/mdi/help-circle'
import SelectorPlaygroundSelectMethod from './SelectorPlaygroundSelectMethod.vue'
import Select from '@packages/frontend-shared/src/components/Select.vue'
import IconConsoleLine from '~icons/mdi/console-line'

const props = defineProps<{
  eventManager: EventManager
  getAutIframe: () => AutIframe
}>()

const methods = [
  {
    display: 'cy.get',
    value: 'get',
  }, {
    display: 'cy.contains',
    value: 'contains',
  },
]

const selectorPlaygroundStore = useSelectorPlaygroundStore()

const copyText = ref<HTMLInputElement>()

watch(() => selectorPlaygroundStore.method, () => {
  props.getAutIframe().toggleSelectorHighlight(true)
})

const selector = computed({
  get () {
    return selectorPlaygroundStore.method === 'get'
      ? selectorPlaygroundStore.getSelector
      : selectorPlaygroundStore.containsSelector
  },
  set (value: string) {
    if (selectorPlaygroundStore.method === 'get') {
      selectorPlaygroundStore.getSelector = value
    }

    if (selectorPlaygroundStore.method === 'contains') {
      selectorPlaygroundStore.containsSelector = value
    }

    props.getAutIframe().toggleSelectorHighlight(true)
  },
})

function setShowingHighlight () {
  selectorPlaygroundStore.setShowingHighlight(true)
  props.getAutIframe().toggleSelectorHighlight(true)
}

function toggleEnabled () {
  const newVal = !selectorPlaygroundStore.isEnabled

  selectorPlaygroundStore.setEnabled(newVal)

  props.getAutIframe().toggleSelectorPlayground(newVal)
}

function printSelected () {
  props.getAutIframe().printSelectorElementsToConsole()
}

function copySelector () {
  try {
    copyText.value?.select()
    const successful = document.execCommand('copy')

    if (successful) {
      // Copied!
    } else {
      // Oops, unable to copy
    }
  } catch (e) {
    // Oops, unable to copy
  }
}
</script>

<style scoped lang="scss">
#selector-playground {
  height: 40px;
}
</style>
