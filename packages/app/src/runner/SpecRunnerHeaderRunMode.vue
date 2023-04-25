<template>
  <div
    id="spec-runner-header"
    ref="autHeaderEl"
    class="min-h-[64px] px-[16px] text-[14px]"
  >
    <!-- this is similar to the Open Mode header but it's not interactive, so can be a lot smaller-->
    <div class="flex grow flex-wrap py-[16px] gap-[12px] justify-end">
      <div
        v-if="testingType === 'e2e'"
        data-cy="aut-url"
        class="border rounded flex grow border-[1px] border-gray-100 h-[32px] align-middle overflow-hidden"
        :class="{
          'bg-gray-50': autStore.isLoadingUrl
        }"
      >
        <div class="mx-[12px] max-w-full grid text-gray-600 items-center truncate">
          {{ autStore.url }}
        </div>
      </div>
      <div
        v-else
        class="grow"
      >
        <!-- spacer -->
      </div>
      <SpecRunnerDropdown
        data-cy="select-browser"
        :disabled="autStore.isRunning"
      >
        <template #heading>
          <img
            v-if="selectedBrowser.displayName"
            class="min-w-[16px] w-[16px]"
            alt=""
            :src="allBrowsersIcons[selectedBrowser.displayName] || allBrowsersIcons.generic"
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
            class="mr-[-6px] text-gray-500"
          >({{ displayScale }})</span>
        </template>
      </SpecRunnerDropdown>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useAutStore } from '../store'
import SpecRunnerDropdown from './SpecRunnerDropdown.vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'
import { useAutHeader } from './useAutHeader'

const displayScale = computed(() => {
  return autStore.scale < 1 ? `${Math.round(autStore.scale * 100) }%` : 0
})

const autStore = useAutStore()

const { autHeaderEl } = useAutHeader()

const selectedBrowser = window.__CYPRESS_BROWSER__
const testingType = window.__CYPRESS_TESTING_TYPE__

</script>
