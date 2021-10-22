<template>
  <Popover
    v-slot="{ open }"
    open
  >
    <PopoverButton>Solutions</PopoverButton>

    <PopoverPanel>
      <div v-if="type === 'ci'">
        CI {{ open }}
      </div>
      <div v-else-if="type === 'orchestration'">
        Orchestration
      </div>
    </PopoverPanel>
  </Popover>
</template>

<script setup lang="ts">

import {
  Popover,
  PopoverOverlay,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/vue'

import { ref } from 'vue'

defineProps<{
	type: 'ci' | 'orchestration',
}>()

const isOpen = ref(true)
</script>
