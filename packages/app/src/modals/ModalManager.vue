/**
 * Only render one full-screen modal at a time
 */

<template>
  <!-- <template v-if="modalStore.active"> -->
    <!-- Simple modals don't need to implement anything exciting -->
    <!-- <StandardModal
      v-if="!modalStore.active.standalone"
      :model-value="true /* default to open */"
      @update:model-value="modalStore.close"
      v-bind="modalStore.active.modalOptions"
    >
      <component
        v-if="modalStore.active"
        :is="modalStore.active.component"
        v-bind="modalStore.active.componentOptions"
        :key="modalStore.activeModalId"
      />
    </StandardModal> -->

    <component :is="modalStore.active.component" v-bind="modalStore.active.componentOptions"/>
  <!-- </template> -->
</template>

<script lang="ts" setup>
import StandardModal from '@cy/components/StandardModal.vue'
import { useModalStore } from '../store'
import { computed } from 'vue'

const modalStore = useModalStore()
</script>
