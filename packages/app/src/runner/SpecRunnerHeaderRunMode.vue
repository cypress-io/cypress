<template>
  <div
    id="spec-runner-header"
    ref="AUTHeaderEl"
    class="min-h-64px px-16px text-14px"
    :style="{ width: `${props.width}px` }"
  >
    <!-- this is similar to the Open Mode header but it's not interactive, so can be a lot smaller-->
    <div class="flex flex-grow flex-wrap py-16px gap-12px justify-end">
      <div
        v-if="testingType === 'e2e'"
        data-cy="aut-url"
        class="border rounded flex flex-grow border-1px border-gray-100 h-32px align-middle overflow-hidden"
        :class="{
          'bg-gray-50': autStore.isLoadingUrl
        }"
      >
        <div class="mx-12px max-w-100% grid text-gray-600 items-center truncate">
          {{ autStore.url }}
        </div>
      </div>
      <div
        v-else
        class="flex-grow"
      >
        <!-- spacer -->
      </div>
      <SpecRunnerDropdown
        data-cy="select-browser"
      >
        <template #heading>
          <img
            v-if="selectedBrowser.displayName"
            class="min-w-16px w-16px"
            :src="allBrowsersIcons[selectedBrowser.displayName]"
          > {{ selectedBrowser.displayName }} {{ selectedBrowser.majorVersion }}
        </template>
      </SpecRunnerDropdown>
      <SpecRunnerDropdown
        variant="panel"
        data-cy="viewport"
      >
        <template #heading>
          <i-cy-ruler_x16 class="icon-dark-gray-500 icon-light-gray-400" />
          <span class="whitespace-nowrap">{{ autStore.viewportWidth }}x{{ autStore.viewportHeight }}</span>
          <span
            v-if="displayScale"
            class="-mr-6px text-gray-500"
          >({{ displayScale }})</span>
        </template>
      </SpecRunnerDropdown>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useAutStore } from '../store'
import type { EventManager } from './event-manager'
import SpecRunnerDropdown from './SpecRunnerDropdown.vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'
import { useElementSize } from '@vueuse/core'

const props = defineProps<{
  eventManager: EventManager
  width: number
}>()

const displayScale = computed(() => {
  return autStore.scale < 1 ? `${Math.round(autStore.scale * 100) }%` : 0
})

const autStore = useAutStore()

const AUTHeaderEl = ref<HTMLDivElement>()

const { height } = useElementSize(AUTHeaderEl)

watch(height, () => {
  autStore.setSpecRunnerHeaderHeight(height.value)
})

const selectedBrowser = window.__CYPRESS_BROWSER__
const testingType = window.__CYPRESS_TESTING_TYPE__

</script>
