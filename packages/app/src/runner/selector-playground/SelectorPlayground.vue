<template>
  <div class="flex">
    <button 
      :class="{ active: selectorPlaygroundStore.isEnabled }"
      @click="toggleEnabled"
    >
      <span class="fa-stack">
        <i class="fas fa-mouse-pointer fa-stack-1x" />
      </span>
    </button>

    <button @click="selectorPlaygroundStore.toggleMethod">Method (cy.{{ selectorPlaygroundStore.method }})</button>

    <input 
      ref="copyText"
      v-model="selector"
    />
    <div>{{ selectorPlaygroundStore.numElements }}</div>
    <button @click="copySelector">Copy</button>
    <button @click="printSelected">Print</button>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { getAutIframeModel } from '..';
import { useSelectorPlaygroundStore } from '../../store/selector-playground-store';
import type { AutIframe } from '../aut-iframe';
import type { EventManager } from '../event-manager';

const props = defineProps<{
  eventManager: EventManager
  autIframe: AutIframe
}>()

const selectorPlaygroundStore = useSelectorPlaygroundStore()

const copyText = ref<HTMLInputElement>()

watch(() => selectorPlaygroundStore.method, (method) => {
  if (method === 'contains') {
    selectorPlaygroundStore.containsSelector = 'Hello world'
  }
})

const selector = computed({
  get () {
    return selectorPlaygroundStore.method === 'get'
      ? selectorPlaygroundStore.getSelector
      : selectorPlaygroundStore.containsSelector
  },
  set (value: string) {
    if (selectorPlaygroundStore.method === 'get') {
    console.log(`get(${value}`)
      selectorPlaygroundStore.getSelector = value
    }

    if (selectorPlaygroundStore.method === 'contains') {
    console.log(`contains(${value}`)
      selectorPlaygroundStore.containsSelector = value
    }

    props.autIframe.toggleSelectorHighlight(true)
  }
})

function toggleEnabled () {
  const newVal = !selectorPlaygroundStore.isEnabled
  selectorPlaygroundStore.setEnabled(newVal)

  console.log({ newVal })

  const autIframe = getAutIframeModel()
  autIframe.toggleSelectorPlayground(newVal)
}

function printSelected () {
  props.autIframe.printSelectorElementsToConsole()
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
