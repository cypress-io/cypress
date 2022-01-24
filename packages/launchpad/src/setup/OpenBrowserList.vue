<template>
  <form
    v-if="browsers"
    @submit.prevent="emit('launch')"
  >
    <div
      class="flex flex-wrap justify-center py-40px gap-24px"
      data-cy="open-browser-list"
    >
      <div
        v-for="browser of browsers"
        :key="browser.id"
        :data-cy-browser="browser.name"
        class="relative block pt-6 pb-4 text-center rounded border-1 min-h-144px w-160px"
        :class="{
          'border-jade-300 ring-2 ring-jade-100 focus:border-jade-400 focus:border-1 focus:outline-none': browser.isSelected,
          'border-gray-200': !browser.isSelected,
          'filter grayscale bg-gray-100': browser.disabled,
          'filter grayscale border-gray-200': (browserIsOpening || isBrowserOpen) && !browser.isSelected,
          'hover:border-indigo-300 hover:ring-2 hover:ring-indigo-100': !browser.disabled && !browser.isSelected
        }"
      >
        <input
          :id="browser.id"
          :key="browser.id"
          v-model="selectedBrowserId"
          type="radio"
          :value="browser.id"
          :disabled="browser.disabled || (browserIsOpening || isBrowserOpen)"
          class="absolute opacity-0"
          :class="{
            'filter grayscale': browser.disabled
          }"
        >
        <label
          :for="browser.id"
          class="radio-label"
          :class="{
            'before:hocus:cursor-pointer': !browser.isSelected
          }"
        >
          <div class="text-center">
            <img
              :src="allBrowsersIcons[browser.displayName]"
              alt=""
              class="inline h-40px w-40px"
            >
          </div>
          <div
            class="pt-2 text-indigo-600 text-18px leading-28px"
            :class="{ 'text-jade-600': browser.isSelected }"
          >
            {{ browser.displayName }}
          </div>
          <div class="text-gray-500 text-14px leading-20px">v{{ browser.majorVersion }}</div>
        </label>
      </div>
    </div>
    <div
      v-if="props.gql.currentTestingType"
      class="mb-14"
    >
      <div class="flex items-center justify-center mb-4 gap-16px">
        <template v-if="!isBrowserOpen">
          <Button
            v-if="!browserIsOpening"
            size="lg"
            type="submit"
            :prefix-icon="props.gql.currentTestingType === 'component' ? TestingTypeComponentIcon : TestingTypeE2E"
            prefix-icon-class="icon-dark-white"
            variant="secondary"
            data-cy="launch-button"
            class="font-medium"
          >
            {{ browserText[props.gql.currentTestingType].start }}
          </Button>
          <Button
            v-else
            size="lg"
            type="button"
            variant="pending"
            class="font-medium"
            :prefix-icon="StatusRunningIcon"
            prefix-icon-class="icon-light-gray-300 icon-dark-white animate-spin"
          >
            {{ browserText[props.gql.currentTestingType].opening }}
          </Button>
        </template>

        <template v-else>
          <Button
            size="lg"
            type="button"
            disabled
            variant="pending"
            :prefix-icon="TestingTypeComponentIcon"
            prefix-icon-class="icon-dark-white"
            class="font-medium"
          >
            {{ browserText.running }}
          </Button>
          <Button
            size="lg"
            type="button"
            variant="outline"
            :prefix-icon="ExportIcon"
            prefix-icon-class="icon-dark-gray-500"
            class="font-medium"
          >
            {{ browserText.focus }}
          </Button>
          <Button
            size="lg"
            type="button"
            variant="outline"
            :prefix-icon="PowerStandbyIcon"
            prefix-icon-class="icon-dark-gray-500"
            class="font-medium"
            @click="closeBrowser"
          >
            {{ browserText.close }}
          </Button>
        </template>
      </div>

      <Button
        size="sm"
        variant="text"
        :prefix-icon="ArrowLeftIcon"
        prefix-icon-class="icon-dark-gray-500"
        class="mx-auto font-medium text-gray-600 hover:text-indigo-500"
        @click="emit('navigated-back')"
      >
        {{ browserText.switchTestingType }}
      </Button>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import { computed } from 'vue'
import _clone from 'lodash/clone'
import { useMutation, gql } from '@urql/vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'
import TestingTypeComponentIcon from '~icons/cy/testing-type-component_x24'
import ExportIcon from '~icons/cy/export_x16'
import PowerStandbyIcon from '~icons/cy/power-standby'
import ArrowLeftIcon from '~icons/cy/arrow-left_x16'
import StatusRunningIcon from '~icons/cy/status-running_x16'
import TestingTypeE2E from '~icons/cy/testing-type-e2e_x24'

import { OpenBrowserListFragment, OpenBrowserList_CloseBrowserDocument, OpenBrowserList_SetBrowserDocument } from '../generated/graphql'

gql`
mutation OpenBrowserList_SetBrowser($id: ID!) {
  launchpadSetBrowser(id: $id) {
    id
    ...OpenBrowserList
  }
}
`

gql`
mutation OpenBrowserList_CloseBrowser {
  closeBrowser
}
`

gql`
fragment OpenBrowserList on CurrentProject {
  id
  currentBrowser {
    id
    displayName
    path
  }
  browsers {
    id
    name
    family
    disabled
    isSelected
    channel
    displayName
    path
    version
    majorVersion
  }
  currentTestingType
}
`

const props = defineProps<{
  gql: OpenBrowserListFragment,
  browserIsOpening: boolean,
  isBrowserOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'navigated-back'): void
  (e: 'launch'): void
}>()

const { t } = useI18n()

const browsers = computed(() => {
  if (!props.gql.browsers) {
    return undefined
  }

  return [...props.gql.browsers].sort((a, b) => a.name === 'Electron' ? 1 : -1)
})

const setBrowser = useMutation(OpenBrowserList_SetBrowserDocument)
const closeBrowserMutation = useMutation(OpenBrowserList_CloseBrowserDocument)

const setSelected = (browserId: string) => {
  setBrowser.executeMutation({ id: browserId })
}

const selectedBrowserId = computed({
  get: () => props.gql.currentBrowser ? props.gql.currentBrowser.id : null,
  set: (newVal) => {
    if (newVal) {
      setSelected(newVal)
    }
  },
})

const selectedBrowserName = computed(() => {
  return browsers.value?.find(
    (browser) => browser.id === selectedBrowserId.value,
  )?.displayName
})

function closeBrowser () {
  closeBrowserMutation.executeMutation({})
}

const browserText = computed(() => {
  const tArgs = { browser: selectedBrowserName.value }

  return {
    e2e: {
      start: t('setupPage.openBrowser.startE2E', tArgs),
      opening: t('setupPage.openBrowser.openingE2E', tArgs),
    },
    component: {
      start: t('setupPage.openBrowser.startComponent', tArgs),
      opening: t('setupPage.openBrowser.openingComponent', tArgs),
    },
    running: t('setupPage.openBrowser.running', tArgs),
    focus: t('setupPage.openBrowser.focus'),
    close: t('setupPage.openBrowser.close'),
    switchTestingType: t('setupPage.openBrowser.switchTestingType'),
  }
})

</script>

<style scoped>
/* Make whole card clickable */
.radio-label::before {
  position: absolute;
  top: 0;
  left: 0;
  content: "";
  height: 100%;
  width: 100%;
}
</style>
