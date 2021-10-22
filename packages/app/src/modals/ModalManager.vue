<template>
  <StandardModal
    :model-value="true /* default to open */"
    @update:model-value="modalStore.close"
  >
    <component
      :is="modals[modalStore.activeModalId]"
      v-if="modalStore.activeModalId"
      :key="modalStore.activeModalId"
    />
  </StandardModal>
</template>

<script lang="ts" setup>
import StandardModal from '@cy/components/StandardModal.vue'
import { useModalStore } from '../store'
import { modals } from './modals'

const modalStore = useModalStore()
</script>
