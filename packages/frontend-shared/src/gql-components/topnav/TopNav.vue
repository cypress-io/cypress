<template>
  <TopNavList
    v-if="versions && runningOldVersion"
    data-cy="cypress-update-popover"
  >
    <template #heading="{ open }">
      <i-cy-arrow-outline-down_x16
        class="h-16px w-16px group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50"
        :class="open ? 'icon-dark-indigo-500 icon-light-indigo-50' : 'icon-dark-gray-500 icon-light-gray-100'"
      />
      <span data-cy="top-nav-version-list">v{{ versions.current.version }} <span
        class="text-indigo-300"
        aria-hidden="true"
      >•</span> Upgrade</span>
    </template>

    <TopNavListItem
      class="min-w-278px py-8px px-16px"
      data-cy="update-hint"
    >
      <div class="whitespace-nowrap">
        <ExternalLink
          :href="`${releasesUrl}/tag/v${versions.latest.version}`"
          class="font-semibold text-indigo-500"
          data-cy="latest-version"
        >
          {{ versions.latest.version }}
        </ExternalLink>
        <br>
        <span class="text-gray-500 text-14px leading-20px">{{ t('topNav.released') }} {{ versions.latest.released }}</span>
      </div>
      <template #suffix>
        <span class="rounded-md bg-indigo-50">
          <span class=" p-5px text-indigo-500">
            {{ t('topNav.latest') }}
          </span>
        </span>
      </template>
    </TopNavListItem>

    <TopNavListItem class="py-8px px-16px pb-16px">
      <p class="leading-normal py-8px pb-16px text-gray-500 text-14px">
        {{ t('topNav.runningOldVersion') }}
      </p>
      <Button
        class="w-full"
        @click="showUpdateModal = true"
      >
        Update to {{ versions.latest.version }}
      </Button>
    </TopNavListItem>

    <TopNavListItem
      class="bg-yellow-50 py-8px px-16px"
      data-cy="current-hint"
    >
      <div class="whitespace-nowrap">
        <ExternalLink
          :href="`${releasesUrl}/tag/v${versions.current.version}`"
          class="font-semibold text-amber-800"
          data-cy="current-version"
        >
          {{ versions.current.version }}
        </ExternalLink>
        <br>
        <span class="text-gray-600 text-14px">{{ t('topNav.released') }} {{ versions.current.released }}</span>
      </div>
      <template #suffix>
        <span class="rounded-md bg-yellow-100">
          <span class="p-5px text-amber-800">
            {{ t('topNav.installed') }}
          </span>
        </span>
      </template>
    </TopNavListItem>

    <TopNavListItem class="text-center p-16px text-indigo-600">
      <ExternalLink
        :href="releasesUrl"
        class="border-rounded border-gray-100 border-1 w-full py-8px text-12px block whitespace-nowrap hover:border-gray-200 hover:no-underline"
      >
        {{ t('topNav.seeAllReleases') }}
      </ExternalLink>
    </TopNavListItem>
  </TopNavList>

  <ExternalLink
    v-else-if="versions"
    :href="`${releasesUrl}/tag/v${versions.latest.version}`"
    class="flex outline-transparent text-gray-600 gap-8px items-center group hocus:text-indigo-500 hocus:outline-0"
    :use-default-hocus="false"
    data-cy="top-nav-cypress-version-current-link"
  >
    <i-cy-box_x16
      class="h-16px w-16px group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50 icon-dark-gray-500 icon-light-gray-100"
    />
    <span>
      v{{ versions.latest.version }}
    </span>
  </ExternalLink>

  <TopNavList
    v-if="props.gql?.currentProject?.currentBrowser && showBrowsers"
  >
    <template #heading="{ open }">
      <img
        class="w-16px filter group-hocus:grayscale-0"
        data-cy="top-nav-active-browser-icon"
        :class="open ? 'grayscale-0' : 'grayscale'"
        :src="allBrowsersIcons[props.gql?.currentProject?.currentBrowser?.displayName || '']"
      >
      <span
        data-cy="top-nav-active-browser"
      >{{ props.gql.currentProject?.currentBrowser?.displayName }} v{{ props.gql.currentProject?.currentBrowser?.majorVersion }}</span>
    </template>
    <TopNavListItem
      v-for="browser in props.gql.currentProject.browsers"
      :key="browser.id"
      class="cursor-pointer min-w-240px py-12px px-16px"
      :class="browser.isSelected ? 'bg-jade-50' : ''"
      :selectable="!browser.isSelected"
      data-cy="top-nav-browser-list-item"
      :data-browser-id="browser.id"
      @click="handleBrowserChoice(browser)"
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
        <button
          class="hocus-link-default box-border"
          :class="browser.isSelected ? 'text-jade-600' : 'text-indigo-600'"
        >
          {{ browser.displayName }}
        </button>
        <div
          class="font-normal mr-20px text-gray-500 text-14px whitespace-nowrap"
        >
          {{ t('topNav.version') }} {{ browser.version }}
        </div>
      </div>
      <template
        v-if="browser.isSelected"
        #suffix
      >
        <div data-cy="top-nav-browser-list-selected-item">
          <i-cy-circle-check_x24 class="h-24px w-24px icon-dark-jade-100 icon-light-jade-500" />
        </div>
      </template>
    </TopNavListItem>
  </TopNavList>

  <TopNavList
    variant="panel"
    role="region"
    aria-live="polite"
  >
    <template #heading="{ open }">
      <i-cy-life-ring_x16
        class=" h-16px w-16px group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50"
        :class="open ? 'icon-dark-indigo-500 icon-light-indigo-50' : 'icon-dark-gray-500 icon-light-gray-100'"
      />
      <span :class="{'text-indigo-600': open}">{{ t('topNav.docsMenu.docsHeading') }}</span>
    </template>
    <div
      v-if="docsMenuVariant === 'main'"
      class="flex p-16px gap-24px"
    >
      <DocsMenuContent
        :current-project-exists="!!props.gql?.currentProject"
        @setDocsContent="docsMenuVariant = $event"
      />
    </div>
    <div
      v-else
      ref="promptsEl"
      class="w-484px"
    >
      <div class="border-b border-b-gray-50 py-18px px-24px text-18px relative">
        {{ t(`topNav.docsMenu.prompts.${docsMenuVariant}.title`) }}
        <button
          aria-label="Close"
          class="border-transparent rounded-full border-1 p-5px top-15px right-20px absolute hocus-default hover:border-indigo-300"
          @click="docsMenuVariant = 'main'"
        >
          <i-cy-delete_x12 class="h-12px w-12px icon-dark-gray-400" />
        </button>
      </div>
      <PromptContent :type="docsMenuVariant" />
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
  <UpdateCypressModal
    v-if="versions"
    :show="showUpdateModal"
    :installed-version="versions.current.version"
    :latest-version="versions.latest.version"
    :project-name="props.gql?.currentProject?.title"
    @close="showUpdateModal = false"
  />
</template>

<script setup lang="ts">
import TopNavListItem from './TopNavListItem.vue'
import TopNavList from './TopNavList.vue'
import PromptContent from './PromptContent.vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'
import { gql, useMutation } from '@urql/vue'
import { TopNavFragment, TopNav_LaunchOpenProjectDocument, TopNav_SetBrowserDocument } from '../../generated/graphql'
import { useI18n } from '@cy/i18n'
import { computed, ref, Ref } from 'vue'
const { t } = useI18n()
import { onClickOutside, onKeyStroke, useTimeAgo } from '@vueuse/core'
import DocsMenuContent from './DocsMenuContent.vue'
import ExternalLink from '../ExternalLink.vue'
import Button from '../../components/Button.vue'
import UpdateCypressModal from './UpdateCypressModal.vue'

const releasesUrl = 'https://github.com/cypress-io/cypress/releases'

gql`
fragment TopNav on Query {
  versions {
    current {
      id
      version
      released
    }
    latest {
      id
      version
      released
    }
  }

  currentProject {
    id
    title
    currentBrowser {
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
}
`

gql`
mutation TopNav_LaunchOpenProject  {
  launchOpenProject
}
`

gql`
mutation TopNav_SetBrowser($id: ID!) {
  launchpadSetBrowser(id: $id)
}
`

const launchOpenProject = useMutation(TopNav_LaunchOpenProjectDocument)
const setBrowser = useMutation(TopNav_SetBrowserDocument)

const launch = () => {
  launchOpenProject.executeMutation({})
}

const handleBrowserChoice = async (browser) => {
  await setBrowser.executeMutation({ id: browser.id })
  launch()
}

const props = defineProps<{
  gql: TopNavFragment,
  showBrowsers?: boolean
}>()

const currentReleased = useTimeAgo(
  props.gql.versions?.current?.released
    ? new Date(props.gql.versions.current.released)
    : '',
)

const latestReleased = useTimeAgo(
  props.gql.versions?.latest?.released
    ? new Date(props.gql.versions.latest.released)
    : '',
)

const versions = computed(() => {
  if (!props.gql.versions) {
    return
  }

  if (!props.gql.versions) {
    return null
  }

  return {
    current: {
      released: currentReleased.value,
      version: props.gql.versions.current.version,
    },
    latest: {
      released: latestReleased.value,
      version: props.gql.versions.latest.version,
    },
  }
})

const runningOldVersion = computed(() => {
  return props.gql.versions ? props.gql.versions.current.released < props.gql.versions.latest.released : false
})

const showUpdateModal = ref(false)

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

const resetPrompt = (event) => {
  if (promptsEl.value === null) {
    return
  }

  const target = event.target as HTMLElement

  if (!promptsEl.value.contains(target)) {
    docsMenuVariant.value = 'main'
  }
}

onKeyStroke('Enter', (event) => {
  resetPrompt(event)
})

onKeyStroke(' ', (event) => {
  resetPrompt(event)
})

</script>
