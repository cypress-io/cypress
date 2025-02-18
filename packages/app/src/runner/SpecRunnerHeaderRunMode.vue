<template>
  <div
    id="spec-runner-header"
    ref="autHeaderEl"
    class="min-h-[64px] px-[16px] text-[14px]"
  >
    <!-- this is similar to the Open Mode header but it's not interactive, so can be a lot smaller-->
    <div class="flex grow flex-wrap py-[16px] gap-[12px] justify-end">
      <div
        data-cy="aut-url"
        class="border rounded flex grow border-[1px] border-gray-100 h-[32px] align-middle overflow-hidden"
        :class="{
          'bg-gray-50': autStore.isLoadingUrl
        }"
      >
        <div class="mx-[12px] flex grow text-gray-600 items-center truncate">
          {{ testingType === 'e2e' ? autStore.url : 'URL navigation disabled in component testing' }}
        </div>
        <Tag
          data-cy="viewport-size"
          size="20"
          color="white"
          class="self-center rounded-[10px] mr-[5px] pr-[6px] pl-[6px]"
        >
          <span class="whitespace-nowrap text-[12px]">{{ autStore.viewportWidth }}x{{
            autStore.viewportHeight
          }}</span>
        </Tag>
        <Tag
          v-if="displayScale"
          data-cy="viewport-scale"
          size="20"
          color="white"
          class="self-center rounded-[10px] mr-[5px] pr-[6px] pl-[6px]"
        >
          <span class="text-[12px]">
            {{ displayScale }}
          </span>
        </Tag>
      </div>
      <SpecRunnerDropdown
        data-cy="select-browser"
        :disabled="autStore.isRunning"
      >
        <template #heading>
          <component
            :is="allBrowsersIcons[selectedBrowser.displayName?.toLowerCase()] || allBrowsersIcons.generic"
            v-if="selectedBrowser.displayName"
            class="min-w-[16px] w-[16px]"
            alt=""
          /> {{ selectedBrowser.displayName }}
          {{ selectedBrowser.majorVersion }}
        </template>
      </SpecRunnerDropdown>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useAutStore } from '../store'
import Tag from '@cypress-design/vue-tag'
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
