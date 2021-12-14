<template>
  <form
    v-if="props.gql.browsers"
    @submit.prevent="emit('launch', props.gql?.currentBrowser?.path)"
  >
    <div
      class="flex flex-wrap justify-center gap-6 py-16"
      data-cy="open-browser-list"
    >
      <div
        v-for="browser of props.gql.browsers"
        :key="browser.id"
        class="relative block pt-6 pb-4 text-center rounded w-160px border-1"
        :class="{
          'border-jade-300 ring-2 ring-jade-50': browser.isSelected,
          'border-gray-200': !browser.isSelected,
          'filter grayscale bg-gray-100': browser.disabled,
          'hover:border-indigo-200 hover:ring-2 hover:ring-indigo-50': !browser.disabled && !browser.isSelected
        }"
        :data-selected-browser="browser.isSelected"
        :data-browser-id="browser.id"
      >
        <input
          :id="browser.id"
          :key="browser.id"
          type="radio"
          :value="browser.id"
          :disabled="browser.disabled"
          class="absolute opacity-0"
          :class="{
            'filter grayscale': browser.disabled
          }"
          @click="setSelected(browser.id)"
        >
        <label
          :for="browser.id"
          class="radio-label"
        >
          <div class="text-center">
            <img
              :src="allBrowsersIcons[browser.displayName]"
              :alt="browser.displayName"
              class="inline w-40px h-40px"
            >
          </div>
          <div class="pt-2 text-lg text-indigo-600">{{ browser.displayName }}</div>
          <div class="text-xs text-gray-400">v{{ browser.majorVersion }}.x</div>
        </label>
      </div>
    </div>
    <div class="mb-14">
      <div class="flex items-center justify-center mb-4">
        <Button
          v-if="launchText"
          type="submit"
          class="inline mr-2"
          :suffix-icon="openInNew"
          data-cy="launch-button"
          size="lg-wide"
        >
          {{ launchText }}
        </Button>
        <Button
          type="button"
          size="lg"
          class="inline ml-2"
          variant="outline"
          @click="emit('navigated-back')"
        >
          {{ t('setupPage.step.back') }}
        </Button>
      </div>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import { computed } from 'vue'
import _clone from 'lodash/clone'
import openInNew from '~icons/mdi/open-in-new'
import { useMutation, gql } from '@urql/vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'

import { OpenBrowserListFragment, OpenBrowserList_SetBrowserDocument } from '../generated/graphql'

gql`
mutation OpenBrowserList_SetBrowser($id: ID!) {
  launchpadSetBrowser(id: $id)
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
}
`

const props = defineProps<{
  gql: OpenBrowserListFragment,
}>()

const emit = defineEmits<{
  (e: 'navigated-back'): void
  (e: 'launch', value: string | undefined): void
}>()

const { t } = useI18n()

const setBrowser = useMutation(OpenBrowserList_SetBrowserDocument)

const setSelected = (browserId: string) => {
  setBrowser.executeMutation({ id: browserId })
}

const launchText = computed(() => props.gql.currentBrowser ? `${t('setupPage.openBrowser.launch')} ${props.gql.currentBrowser.displayName}` : '')
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
