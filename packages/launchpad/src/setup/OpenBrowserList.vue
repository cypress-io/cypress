<template>
  <form
    v-if="browsers"
    @submit.prevent="emit('launch')"
  >
    <RadioGroup
      v-model="selectedBrowserId"
      class="flex flex-wrap py-40px gap-24px justify-center"
      data-cy="open-browser-list"
    >
      <RadioGroupOption
        v-for="browser of browsers"
        v-slot="{ checked }"
        :key="browser.id"
        :data-cy-browser="browser.name"
        :value="browser.id"
        :disabled="browser.disabled || (isBrowserOpening || isBrowserOpen)"
      >
        <RadioGroupLabel
          :for="browser.id"
          class="rounded border-1 text-center min-h-144px pt-6 pb-4 w-160px relative block radio-label"
          :class="{
            'border-jade-300 ring-2 ring-jade-100 focus:border-jade-400 focus:border-1 focus:outline-none': checked,
            'border-gray-200 before:hocus:cursor-pointer': !checked && !(isBrowserOpening || isBrowserOpen) ,
            'filter grayscale bg-gray-100': browser.disabled,
            'filter grayscale border-gray-200': (isBrowserOpening || isBrowserOpen) && !checked,
            'hover:border-indigo-300 hover:ring-2 hover:ring-indigo-100': !browser.disabled && !checked && !(isBrowserOpening || isBrowserOpen)
          }"
        >
          <div class="text-center">
            <img
              :src="allBrowsersIcons[browser.displayName]"
              alt=""
              class="h-40px w-40px inline"
            >
          </div>
          <div
            class="pt-2 text-indigo-600 text-18px leading-28px"
            :class="{ 'text-jade-600': browser.isSelected }"
          >
            {{ browser.displayName }}
          </div>
          <div class="text-gray-500 text-14px leading-20px">
            v{{ browser.majorVersion }}
          </div>
        </RadioGroupLabel>
      </RadioGroupOption>
    </RadioGroup>
    <div
      v-if="props.gql.currentTestingType"
      class="mb-14"
    >
      <div class="flex mb-4 gap-16px items-center justify-center">
        <template v-if="!isBrowserOpen">
          <Button
            v-if="!isBrowserOpening"
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
            disabled
            variant="pending"
            class="font-medium disabled:cursor-default"
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
            class="font-medium disabled:cursor-default"
          >
            {{ browserText.running }}
          </Button>
          <Button
            v-if="props.gql.currentBrowser?.isFocusSupported"
            size="lg"
            type="button"
            variant="outline"
            :prefix-icon="ExportIcon"
            prefix-icon-class="icon-dark-gray-500"
            class="font-medium"
            @click="emit('focus-browser')"
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
            @click="emit('close-browser')"
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
        class="font-medium mx-auto text-gray-600 hover:text-indigo-500"
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
import { RadioGroup, RadioGroupOption, RadioGroupLabel } from '@headlessui/vue'

import { OpenBrowserListFragment, OpenBrowserList_SetBrowserDocument } from '../generated/graphql'

gql`
mutation OpenBrowserList_SetBrowser($id: ID!) {
  launchpadSetBrowser(id: $id) {
    id
    ...OpenBrowserList
  }
}
`

gql`
fragment OpenBrowserList on CurrentProject {
  id
  currentBrowser {
    id
    displayName
    path
    isFocusSupported
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
  isBrowserOpening: boolean,
  isBrowserOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'navigated-back'): void
  (e: 'launch'): void
  (e: 'close-browser'): void
  (e: 'focus-browser'): void
}>()

const { t } = useI18n()

const browsers = computed(() => {
  if (!props.gql.browsers) {
    return undefined
  }

  return [...props.gql.browsers].sort((a, b) => a.name === 'Electron' ? 1 : -1)
})

const setBrowser = useMutation(OpenBrowserList_SetBrowserDocument)

const selectedBrowserId = computed({
  get: () => props.gql.currentBrowser?.id || props.gql.browsers?.find((browser) => browser.displayName === 'Electron')?.id,
  set (browserId) {
    if (browserId) {
      setBrowser.executeMutation({ id: browserId })
    }
  },
})

const selectedBrowserName = computed(() => {
  return browsers.value?.find(
    (browser) => browser.id === selectedBrowserId.value,
  )?.displayName
})

const browserText = computed(() => {
  const tArgs = { browser: selectedBrowserName.value }

  return {
    e2e: {
      start: t('openBrowser.startE2E', tArgs),
      opening: t('openBrowser.openingE2E', tArgs),
    },
    component: {
      start: t('openBrowser.startComponent', tArgs),
      opening: t('openBrowser.openingComponent', tArgs),
    },
    running: t('openBrowser.running', tArgs),
    focus: t('openBrowser.focus'),
    close: t('openBrowser.close'),
    switchTestingType: t('openBrowser.switchTestingType'),
  }
})

</script>
