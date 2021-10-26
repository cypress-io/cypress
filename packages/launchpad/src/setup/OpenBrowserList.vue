<template>
  <form
    v-if="props.gql.browsers"
    @submit.prevent="$emit('launch')"
  >
    <div
      v-if="props.gql.browserErrorMessage"
      data-test-id="browser-error-message"
      class="flex items-center p-4 text-center rounded min-w-200px max-w-600px mx-auto space-y-32px mt-20px bg-warning-100 text-warning-600"
    >
      <i-cy-runs-warn_x24 class="w-40px h-40px" />
      {{ props.gql.browserErrorMessage }}
    </div>
    <div class="flex flex-wrap justify-center gap-6 py-16">
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
          data-testid="launch-button"
          size="lg-wide"
        >
          {{ launchText }}
        </Button>
        <Button
          type="button"
          size="lg"
          class="inline ml-2"
          variant="outline"
          @click="$emit('navigated-back')"
        >
          {{ t('setupPage.step.back') }}
        </Button>
      </div>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import { OpenBrowserListFragment, OpenBrowserList_SetBrowserDocument } from '../generated/graphql'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import { computed } from 'vue'
import _clone from 'lodash/clone'
import openInNew from '~icons/mdi/open-in-new'
import { useMutation, gql } from '@urql/vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'

gql`
mutation OpenBrowserList_SetBrowser($id: ID!) {
  launchpadSetBrowser(id: $id)
}
`

gql`
fragment OpenBrowserList on App {
  selectedBrowser {
    id
    displayName
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
  browserErrorMessage
}
`

const props = defineProps<{
  gql: OpenBrowserListFragment,
}>()

defineEmits(['navigated-back', 'launch'])

const { t } = useI18n()

const setBrowser = useMutation(OpenBrowserList_SetBrowserDocument)

const setSelected = (browserId: string) => {
  setBrowser.executeMutation({ id: browserId })
}

const launchText = computed(() => props.gql.selectedBrowser ? `${t('setupPage.openBrowser.launch')} ${props.gql.selectedBrowser.displayName}` : '')
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
