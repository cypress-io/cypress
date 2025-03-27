<template>
  <form
    v-if="browsers"
    @submit.prevent="emit('launch')"
  >
    <RadioGroup
      v-model="selectedBrowserId"
      class="flex flex-wrap py-[40px] gap-[24px] justify-center"
      data-cy="open-browser-list"
    >
      <RadioGroupOption
        v-for="browser of browsers"
        v-slot="{ checked }"
        :key="browser.id"
        :data-cy-browser="browser.name"
        :value="browser.id"
        :disabled="browser.disabled || !browser.isVersionSupported ||browserStatus.chosen"
      >
        <RadioGroupLabel
          :for="browser.id"
          class="rounded border text-center min-h-[144px] pt-6 pb-4 w-[160px] relative block radio-label"
          :class="{
            'border-jade-300 ring-2 ring-jade-100 focus:border-jade-400 focus:border focus:outline-none': checked,
            'border-gray-100 bg-gray-50 before:hocus:cursor-not-allowed': browser.disabled || !browser.isVersionSupported,
            'border-gray-100 filter grayscale': browserStatus.chosen && !checked,
            'border-gray-100 before:hocus:cursor-pointer hover:border-indigo-300 hover:ring-2 hover:ring-indigo-100': !browser.disabled && browser.isVersionSupported && !checked && !browserStatus.chosen
          }"
        >
          <Tooltip
            v-if="browser.warning"
            popper-class="max-w-lg"
          >
            <i-cy-circle-bg-question-mark_x16
              data-cy="browser-warning-tooltip-trigger"
              class="mt-[8px] mr-[8px] top-0 right-0 inline-block absolute icon-dark-gray-700 icon-light-gray-200"
              alt="browser warning"
            />
            <template #popper>
              <div class="text-center p-2 text-gray-300 text-[14px] leading-[20px]">
                <div
                  v-if="!browser.isVersionSupported"
                  class="font-medium text-white mb-2"
                >
                  Unsupported browser
                </div>
                {{ browser.warning }}
              </div>
            </template>
          </Tooltip>
          <div class="text-center">
            <component
              :is="allBrowsersIcons[browser.displayName?.toLowerCase()] || allBrowsersIcons.generic"
              alt=""
              class="h-[40px] w-[40px] inline"
              :class="{ 'filter grayscale': browser.disabled || !browser.isVersionSupported }"
            />
          </div>
          <div
            class="font-medium pt-2 px-2 text-[18px] leading-[28px] truncate"
            :class="checked ? 'text-jade-600' : (browser.disabled || !browser.isVersionSupported ) ? 'text-gray-500' : 'text-indigo-600'"
          >
            {{ browser.displayName }}
          </div>
          <div class="text-gray-500 text-[14px] leading-[20px]">
            v{{ browser.majorVersion }}
          </div>
        </RadioGroupLabel>
      </RadioGroupOption>
    </RadioGroup>
    <div
      v-if="props.gql.currentTestingType"
      class="mb-14"
    >
      <div class="flex mb-4 gap-[16px] items-center justify-center">
        <template v-if="selectedBrowserId">
          <template v-if="browserStatus.closed || browserStatus.opening">
            <Button
              v-if="browserStatus.closed"
              size="40"
              type="submit"
              variant="jade-dark"
              data-cy="launch-button"
            >
              <component
                :is="testingTypeIcon"
                class="mr-[8px] icon-dark-white"
              />
              {{ browserText[props.gql.currentTestingType].start }}
            </Button>
            <Button
              v-else
              size="40"
              type="button"
              disabled
              variant="disabled"
              class="font-medium disabled:cursor-default"
            >
              <StatusRunningIcon class="mr-[8px] icon-dark-white icon-light-gray-300 animate-spin" />
              {{ browserText[props.gql.currentTestingType].opening }}
            </Button>
          </template>
          <template v-else>
            <Button
              size="40"
              type="button"
              disabled
              variant="disabled"
              class="font-medium disabled:cursor-default"
            >
              <component
                :is="testingTypeIcon"
                class="mr-[8px] icon-dark-gray-500 icon-light-transparent"
              />
              {{ browserText.running }}
            </Button>
            <Button
              v-if="props.gql.activeBrowser?.isFocusSupported"
              size="40"
              type="button"
              variant="outline-light"
              class="font-medium"
              @click="emit('focusBrowser')"
            >
              <ExportIcon class="mr-[8px] icon-dark-gray-500" />
              {{ browserText.focus }}
            </Button>
            <Button
              size="40"
              type="button"
              variant="outline-light"
              class="font-medium"
              @click="emit('closeBrowser')"
            >
              <PowerStandbyIcon class="mr-[8px] icon-dark-gray-500" />
              {{ browserText.close }}
            </Button>
          </template>
        </template>
      </div>

      <Button
        size="24"
        variant="link"
        class="font-medium mx-auto text-gray-600 hocus-link-default group hocus:text-indigo-500"
        @click="emit('navigatedBack')"
      >
        <ArrowRightIcon
          class="mr-[8px] icon-dark-gray-500 transform transition-transform ease-in duration-200 inline-block group-hocus:icon-dark-indigo-500 rotate-180 group-hocus:translate-x-[-2px]"
        />
        {{ browserText.switchTestingType }}
      </Button>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import Button from '@cypress-design/vue-button'
import { computed } from 'vue'
import { useMutation, gql, useSubscription } from '@urql/vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'
import TestingTypeComponentIcon from '~icons/cy/testing-type-component_x16'
import TestingTypeE2EIcon from '~icons/cy/testing-type-e2e_x16'
import ExportIcon from '~icons/cy/export_x16'
import PowerStandbyIcon from '~icons/cy/power-standby'
import ArrowRightIcon from '~icons/cy/arrow-right_x16'
import StatusRunningIcon from '~icons/cy/status-running_x16'
import { RadioGroup, RadioGroupOption, RadioGroupLabel } from '@headlessui/vue'
import Tooltip from '@packages/frontend-shared/src/components/Tooltip.vue'

import type { OpenBrowserListFragment } from '../generated/graphql'
import { OpenBrowserList_SetBrowserDocument, OpenBrowserList_BrowserStatusChangeDocument } from '../generated/graphql'

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
  activeBrowser {
    id
    isFocusSupported
  }
  browsers {
    id
    disabled
    name
    displayName
    isVersionSupported
    warning
    majorVersion
  }
  currentTestingType
  browserStatus
}

subscription OpenBrowserList_browserStatusChange {
  browserStatusChange {
    id
    browserStatus
    activeBrowser {
      id
      isFocusSupported
    }
  }
}
`

useSubscription({ query: OpenBrowserList_BrowserStatusChangeDocument })

const props = defineProps<{
  gql: OpenBrowserListFragment
}>()

const emit = defineEmits<{
  (e: 'navigatedBack'): void
  (e: 'launch'): void
  (e: 'closeBrowser'): void
  (e: 'focusBrowser'): void
}>()

const { t } = useI18n()

const browsers = computed(() => {
  // Need to slice(). `sort()` mutates, and props are supposed to be `readonly`.
  return (props.gql.browsers ?? []).slice().sort((a, b) => a.displayName > b.displayName ? 1 : -1)
})

const setBrowser = useMutation(OpenBrowserList_SetBrowserDocument)

const selectedBrowserId = computed({
  get: () => {
    // NOTE: The activeBrowser is set during project initialization. It should always be defined.
    return props.gql.activeBrowser?.id
  },
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

const browserStatus = computed(() => {
  const status = {
    open: props.gql.browserStatus === 'open',
    opening: props.gql.browserStatus === 'opening',
    closed: props.gql.browserStatus === 'closed',
  }

  return {
    ...status,
    chosen: status.opening || status.open,
  }
})

const testingTypeIcon = computed(() => props.gql.currentTestingType === 'component' ? TestingTypeComponentIcon : TestingTypeE2EIcon)

</script>
