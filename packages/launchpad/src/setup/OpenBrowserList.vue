<template>
  <form
    v-if="props.gql.browsers"
    @submit.prevent="emit('launch', props.gql?.currentBrowser?.path)"
  >
    <div
      class="flex flex-wrap py-40px gap-24px justify-center"
      data-cy="open-browser-list"
    >
      <div
        v-for="browser of props.gql.browsers"
        :key="browser.id"
        :data-cy-browser="browser.name"
        class="rounded border-1 text-center min-h-144px pt-6 pb-4 w-160px relative block"
        :class="{
          'border-jade-300 ring-2 ring-jade-100 focus:border-jade-400 focus:border-1 focus:outline-none': browser.isSelected,
          'border-gray-200': !browser.isSelected,
          'filter grayscale bg-gray-100': browser.disabled,
          'hover:border-indigo-300 hover:ring-2 hover:ring-indigo-100': !browser.disabled && !browser.isSelected
        }"
      >
        <input
          :id="browser.id"
          :key="browser.id"
          v-model="selectedBrowserId"
          type="radio"
          :value="browser.id"
          :disabled="browser.disabled"
          class="opacity-0 absolute"
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
              class="h-40px w-40px inline"
            >
          </div>
          <div
            class="pt-2 text-indigo-600 text-18px leading-28px"
            :class="{ 'text-jade-600': browser.isSelected }"
          >{{ browser.displayName }}</div>
          <div class="text-14px text-gray-500 leading-20px">v{{ browser.majorVersion }}</div>
        </label>
      </div>
    </div>
    <div class="mb-14">
      <div class="flex mb-4 items-center justify-center">
        <Button
          v-if="launchText"
          type="submit"
          class="mr-2 inline"
          :suffix-icon="openInNew"
          data-cy="launch-button"
          size="lg-wide"
        >
          {{ launchText }}
        </Button>
        <Button
          type="button"
          size="lg"
          class="ml-2 inline"
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
import { computed, watch } from 'vue'
import _clone from 'lodash/clone'
import openInNew from '~icons/mdi/open-in-new'
import { useMutation, gql } from '@urql/vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'

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

const selectedBrowserId = computed({
  get: () => props.gql.currentBrowser ? props.gql.currentBrowser.id : null,
  set: (newVal) => {
    if (newVal) {
      setSelected(newVal)
    }
  },
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
