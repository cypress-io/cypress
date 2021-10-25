<template>
  <TopNavList v-if="versionList">
    <template #heading="{ open }">
      <i-cy-box_x16
        class="group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50 h-16px w-16px"
        :class="open ? 'icon-dark-indigo-500 icon-light-indigo-50' : 'icon-dark-gray-500 icon-light-gray-100'"
      />
      <span data-cy="topnav-version-list">v{{ versionList[0].version }}</span>
    </template>
    <TopNavListItem
      v-for="(item, index) in versionList"
      :key="item.version"
      :selectable="!!index"
      class="px-16px py-8px min-w-240px"
      :class="index ? '' : 'bg-jade-50'"
    >
      <div class="whitespace-nowrap">
        <a
          :href="`${releasesUrl}/tag/v${item.version}`"
          :class="index ? '' : 'text-jade-600'"
          class="font-semibold"
          target="_blank"
        >{{ item.version }}</a>
        <br>
        <span class="text-gray-600 text-14px">{{ t('topNav.released') }} {{ item.released }}</span>
      </div>
      <template
        v-if="!index"
        #suffix
      >
        <i-cy-circle-check_x24 class="icon-dark-jade-100 icon-light-jade-500 w-24px h-24px" />
      </template>
    </TopNavListItem>
    <TopNavListItem class="text-center p-16px bg-gray-50">
      <a
        :href="releasesUrl"
        target="_blank"
        class="block w-full border-gray-100 py-8px text-14px whitespace-nowrap border-rounded border-1 hover:no-underline hover:border-gray-200"
      >{{ t('topNav.seeAllReleases') }}</a>
    </TopNavListItem>
  </TopNavList>

  <TopNavList v-if="props.gql?.selectedBrowser && showBrowsers">
    <template #heading="{ open }">
      <img
        class="w-16px filter group-hocus:grayscale-0"
        :class="open ? 'grayscale-0' : 'grayscale'"
        :src="allBrowsersIcons[props.gql?.selectedBrowser?.displayName || '']"
      >
      <span
        data-cy="topnav-browser-list"
      >{{ props.gql.selectedBrowser?.displayName }} v{{ props.gql.selectedBrowser?.majorVersion }}</span>
    </template>
    <TopNavListItem
      v-for="browser in props.gql.browsers"
      :key="browser.id"
      class="px-16px py-12px min-w-240px"
      :class="browser.isSelected ? 'bg-jade-50' : ''"
      :selectable="!browser.isSelected"
    >
      <template #prefix>
        <!-- setting both width and min-width on these icons looks odd,
        but makes all possible browser icons happy about what size to be-->
        <img
          class="mr-16px min-w-26px w-26px"
          :src="allBrowsersIcons[browser.displayName]"
        >
      </template>
      <div>
        <div
          :class="browser.isSelected ? 'text-jade-600' : 'text-indigo-600'"
        >
          {{ browser.displayName }}
        </div>
        <div
          class="font-normal text-gray-500 mr-20px whitespace-nowrap text-14px"
        >
          {{ t('topNav.version') }} {{ browser.version }}
        </div>
      </div>
      <template
        v-if="browser.isSelected"
        #suffix
      >
        <div>
          <i-cy-circle-check_x24 class="icon-dark-jade-100 icon-light-jade-500 w-24px h-24px" />
        </div>
      </template>
    </TopNavListItem>
  </TopNavList>

  <TopNavList variant="panel">
    <template #heading="{ open }">
      <i-cy-life-ring_x16
        class=" group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50 h-16px w-16px"
        :class="open ? 'icon-dark-indigo-500 icon-light-indigo-50' : 'icon-dark-gray-500 icon-light-gray-100'"
      />
      <span :class="{'text-indigo-600': open}">{{ t('topNav.docsMenu.docsHeading') }}</span>
    </template>
    <div
      v-if="docsMenuVariant === 'main'"
      class="flex p-16px gap-24px"
    >
      <DocsMenuContent @setDocsContent="docsMenuVariant = $event" />
    </div>
    <div
      v-else
      ref="promptsEl"
      class="w-484px"
    >
      <div class="relative border-b border-b-gray-50 px-24px py-18px text-18px">
        {{ t(`topNav.docsMenu.prompts.${docsMenuVariant}.title`) }}
        <button
          aria-label="Close"
          class="absolute border-transparent rounded-full p-5px border-1 hover:border-indigo-300 hocus-default right-20px top-15px"
          @click="docsMenuVariant = 'main'"
        >
          <i-cy-delete_x12 class="icon-dark-gray-400 w-12px h-12px" />
        </button>
      </div>
      <GrowthMenuContentVue :type="docsMenuVariant" />
    </div>
  </TopNavList>

  <TopNavList
    v-if="$slots['login-title']"
    variant="panel"
  >
    <template #heading>
      <slot name="login-title" />
    </template>
    <slot name="login-panel" />
  </TopNavList>
</template>

<script setup lang="ts">
import TopNavListItem from './TopNavListItem.vue'
import TopNavList from './TopNavList.vue'
import GrowthMenuContentVue from './GrowthMenuContent.vue'
import { allBrowsersIcons } from '../../../../frontend-shared/src/assets/browserLogos'
import { gql } from '@urql/vue'
import type { TopNavFragment } from '../../generated/graphql'
import { useI18n } from '@cy/i18n'
import { ref } from 'vue'
// eslint-disable-next-line no-duplicate-imports
import type { Ref } from 'vue'
const { t } = useI18n()
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import DocsMenuContent from './DocsMenuContent.vue'

const releasesUrl = 'https://github.com/cypress-io/cypress/releases/'

// TODO: will come from gql
const versionList = [
  {
    version: '8.4.1',
    released: '2 days ago',
  },
  {
    version: '8.4.0',
    released: '6 days ago',
  },
  {
    version: '8.3.1',
    released: '12 days ago',
  },
  {
    version: '8.3.0',
    released: '2 weeks ago',
  },
]

gql`
fragment TopNav on App {
  selectedBrowser {
    id
    displayName
    majorVersion
  }
  browsers {
    id
    isSelected
    displayName
    version
    majorVersion
  }
}
`

const props = defineProps<{
  gql: TopNavFragment,
  showBrowsers?: Boolean
}>()

const docsMenuVariant: Ref<'main' | 'orchestration' | 'ci'> = ref('main')

const promptsEl: Ref<HTMLElement | null> = ref(null)

// reset docs menu if click or keyboard navigation happens outside
// so it doesn't reopen on the one of the prompts

onClickOutside(promptsEl, () => {
  setTimeout(() => {
    // reset the content of the menu when
    docsMenuVariant.value = 'main'
  }, 300)
})

// using onKeyStroke twice as array of keys is not supported till vueuse 6.6:

onKeyStroke('Enter', (event) => {
  if (promptsEl.value === null) {
    return
  }

  const target = event.target as HTMLElement

  if (!promptsEl.value.contains(target)) {
    docsMenuVariant.value = 'main'
  }
})

onKeyStroke(' ', (event) => {
  if (promptsEl.value === null) {
    return
  }

  const target = event.target as HTMLElement

  if (!promptsEl.value.contains(target)) {
    docsMenuVariant.value = 'main'
  }
})

</script>
