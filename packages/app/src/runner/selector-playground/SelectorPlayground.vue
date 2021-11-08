<template>
  <div class="flex">
    <button
      :class="{ active: selectorPlaygroundStore.isEnabled }"
      data-cy="playground-toggle"
      @click="toggleEnabled"
    >
      <span class="fa-stack">
        <i class="fas fa-mouse-pointer fa-stack-1x" />
      </span>
    </button>

    <button
      data-cy="playground-method"
      @click="selectorPlaygroundStore.toggleMethod"
    >
      cy.{{ selectorPlaygroundStore.method }}('
    </button>

    <input
      ref="copyText"
      v-model="selector"
      data-cy="playground-selector"
    >
    ')
    <div data-cy="playground-num-elements">
      {{ selectorPlaygroundStore.numElements }}
    </div>
    <button
      data-cy="playground-copy"
      @click="copySelector"
    >
      Copy
    </button>
    <button
      data-cy="playground-print"
      @click="printSelected"
    >
      Print
    </button>

    <a
      class="selector-info"
      href="https://on.cypress.io/selector-playground"
      target="_blank"
      rel="noreferrer"
    >
      <i class="fas fa-question-circle" />Learn more
    </a>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useSelectorPlaygroundStore } from '../../store/selector-playground-store'
import type { AutIframe } from '../aut-iframe'
import type { EventManager } from '../event-manager'

const props = defineProps<{
  eventManager: EventManager
  getAutIframe: () => AutIframe
}>()

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
button {
  @apply flex items-center justify-center;
  @apply rounded-md bg-white flex shadow-md ml-2;
  @apply w-20 hover:bg-gray-50;
}

button.active {
  @apply bg-blue-200;
}
</style>
