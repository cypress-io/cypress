<template>
  <TopNavList
    v-if="versions && runningOldVersion"
    data-cy="cypress-update-popover"
  >
    <template #heading>
      <i-cy-cypress-logo_x16
        class="h-[16px] text-indigo-500 w-[16px] icon-dark-indigo-500 icon-light-indigo-50"
      />
      <span
        data-cy="top-nav-version-list"
        class="font-medium text-indigo-500 whitespace-nowrap"
      >v{{ versions.current.version }} <span
        class="text-indigo-300"
        aria-hidden="true"
      >•</span> {{ t('topNav.upgradeText') }}</span>
    </template>

    <TopNavListItem
      class="min-w-[278px] py-[8px] px-[16px]"
      data-cy="update-hint"
    >
      <div class="font-medium">
        <ExternalLink
          :href="changelogLink(versions.latest.version)"
          class="text-indigo-500"
          data-cy="latest-version"
        >
          {{ versions.latest.version }}
        </ExternalLink>
        <br>
        <span class="text-gray-500 text-[14px] leading-[20px]">{{ t('topNav.released') }} {{ versions.latest.released }}</span>
      </div>
      <template #suffix>
        <span class="rounded-md bg-indigo-50">
          <span class=" p-[5px] text-indigo-500">
            {{ t('topNav.latest') }}
          </span>
        </span>
      </template>
    </TopNavListItem>

    <TopNavListItem class="py-[8px] px-[16px] pb-[16px]">
      <p class="leading-normal py-[8px] pb-[16px] text-gray-500 text-[14px]">
        {{ t('topNav.runningOldVersion') }}
      </p>
      <Button
        class="!w-full"
        @click="showUpdateModal = true"
      >
        Update to {{ versions.latest.version }}
      </Button>
    </TopNavListItem>

    <TopNavListItem
      class="bg-orange-50 py-[8px] px-[16px]"
      data-cy="current-hint"
    >
      <div class="whitespace-nowrap">
        <ExternalLink
          :href="changelogLink(versions.current.version)"
          class="font-medium text-amber-800"
          data-cy="current-version"
        >
          {{ versions.current.version }}
        </ExternalLink>
        <br>
        <span class="text-gray-600 text-[14px]">{{ t('topNav.released') }} {{ versions.current.released }}</span>
      </div>
      <template #suffix>
        <span class="rounded-md bg-orange-100">
          <span class="p-[5px] text-amber-800">
            {{ t('topNav.installed') }}
          </span>
        </span>
      </template>
    </TopNavListItem>

    <TopNavListItem class="text-center p-[16px] text-indigo-600">
      <ExternalLink
        href="https://on.cypress.io/changelog"
        class="border-rounded border-gray-100 border w-full py-[8px] text-[12px] block whitespace-nowrap hover:border-gray-200 hover:no-underline"
      >
        {{ t('topNav.seeAllReleases') }}
      </ExternalLink>
    </TopNavListItem>
  </TopNavList>

  <ExternalLink
    v-else-if="versions"
    :href="changelogLink(versions.current.version)"
    class="flex font-medium outline-transparent text-gray-600 gap-[8px] items-center group hocus:text-indigo-500 hocus:outline-0"
    :use-default-hocus="false"
    data-cy="top-nav-cypress-version-current-link"
  >
    <i-cy-cypress-logo_x16
      class="h-[16px] w-[16px] group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50 icon-dark-gray-500 icon-light-gray-100"
    />
    <span>
      v{{ versions.current.version }}
    </span>
  </ExternalLink>

  <TopNavList
    v-if="props.gql?.currentProject?.activeBrowser && showBrowsers"
  >
    <template #heading="{ open }">
      <component
        :is="allBrowsersIcons[props.gql.currentProject.activeBrowser.displayName?.toLowerCase()] || allBrowsersIcons.generic"
        v-if="props.gql?.currentProject?.activeBrowser?.displayName"
        class="w-[16px] filter group-hocus:grayscale-0"
        data-cy="top-nav-active-browser-icon"
        :alt="props.gql?.currentProject?.activeBrowser?.displayName"
        :class="open ? 'grayscale-0' : 'grayscale'"
      />
      <span
        data-cy="top-nav-active-browser"
        class="font-medium whitespace-nowrap"
      >{{ props.gql.currentProject?.activeBrowser?.displayName }} {{ props.gql.currentProject?.activeBrowser?.majorVersion }}</span>
    </template>
    <VerticalBrowserListItems
      :gql="props.gql.currentProject"
    />
  </TopNavList>

  <TopNavList
    ref="promptsEl"
    variant="panel"
    role="region"
    aria-live="polite"
    :force-open-state="props.forceOpenDocs"
    @clear-force-open="emit('clearForceOpen')"
  >
    <template #heading="{ open }">
      <i-cy-life-ring_x16
        class=" h-[16px] w-[16px] group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50"
        :class="(open || props.forceOpenDocs) ? 'icon-dark-indigo-500 icon-light-indigo-50' : 'icon-dark-gray-500 icon-light-gray-100'"
      />
      <span
        class="font-medium"
        :class="{'text-indigo-600': open}"
      >{{ t('topNav.docsMenu.docsHeading') }}</span>
    </template>
    <div
      v-if="docsMenuVariant === 'main'"
      data-cy="docs-menu-container"
      class="flex flex-col p-[16px] gap-[24px] md:flex-row"
    >
      <DocsMenuContent
        :current-project-exists="!!props.gql?.currentProject"
        @setDocsContent="docsMenuVariant = $event"
      />
    </div>
    <div
      v-else
      ref="promptsEl"
      class="w-[484px]"
    >
      <div class="border-b border-b-gray-50 py-3 px-6 text-lg relative">
        {{ t(`topNav.docsMenu.prompts.${docsMenuVariant}.title`) }}
        <button
          aria-label="Close"
          class="border-transparent rounded-full border p-[5px] top-[15px] right-[20px] absolute hocus-default hover:border-indigo-300"
          @click="docsMenuVariant = 'main'"
        >
          <i-cy-delete_x12 class="h-[12px] w-[12px] icon-dark-gray-400" />
        </button>
      </div>
      <PromptContent
        :type="docsMenuVariant"
        :automatic="props.forceOpenDocs"
      />
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
    :install-command="installCommand"
    @close="showUpdateModal = false"
  />
</template>

<script setup lang="ts">
import TopNavListItem from './TopNavListItem.vue'
import TopNavList from './TopNavList.vue'
import PromptContent from './PromptContent.vue'
import { allBrowsersIcons } from '@packages/frontend-shared/src/assets/browserLogos'
import { gql, useMutation } from '@urql/vue'
import { TopNav_SetPromptShownDocument } from '../../generated/graphql'
import type { TopNavFragment } from '../../generated/graphql'
import { useI18n } from '@cy/i18n'
import { computed, ref, watch, watchEffect } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { onClickOutside, onKeyStroke, useTimeAgo } from '@vueuse/core'
import type { DocsMenuVariant } from './DocsMenuContent.vue'
import DocsMenuContent from './DocsMenuContent.vue'
import ExternalLink from '../ExternalLink.vue'
import Button from '../../components/Button.vue'
import UpdateCypressModal from './UpdateCypressModal.vue'
import VerticalBrowserListItems from './VerticalBrowserListItems.vue'

const { t } = useI18n()

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
    packageManager
    activeBrowser {
      id
      displayName
      majorVersion
    }
    ...VerticalBrowserListItems
  }
}
`

gql`
mutation TopNav_SetPromptShown($slug: String!) {
  setPromptShown(slug: $slug)
}
`

const setPromptShown = useMutation(TopNav_SetPromptShownDocument)

const props = defineProps<{
  gql: TopNavFragment
  showBrowsers?: boolean
  forceOpenDocs?: boolean
}>()

const emit = defineEmits<{
  (e: 'clearForceOpen'): void
}>()
const promptsEl = ref<ComponentPublicInstance | null>(null)

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

const docsMenuVariant = ref<DocsMenuVariant>('main')

watchEffect(() => {
  docsMenuVariant.value = props.forceOpenDocs ? 'ci1' : 'main'
})

watch(docsMenuVariant, (newVal, oldVal) => {
  if (oldVal !== 'main') {
    setPromptShown.executeMutation({ slug: `${oldVal}` })
  }
})

// reset docs menu if click or keyboard navigation happens outside
// so it doesn't reopen on the one of the prompts

onClickOutside(promptsEl, () => {
  emit('clearForceOpen')
  setTimeout(() => {
    // reset the content of the menu when
    docsMenuVariant.value = 'main'
  }, 300)
})

const resetPrompt = (event) => {
  if (promptsEl.value === null) {
    return
  }

  const target = event.target as HTMLElement

  if (!promptsEl.value?.$el.contains(target)) {
    docsMenuVariant.value = 'main'
  }
}

const installCommand = computed(() => {
  switch (props.gql.currentProject?.packageManager) {
    case 'npm':
      return 'npm install -D '
    case 'yarn':
      return 'yarn add -D '
    case 'pnpm':
      return 'pnpm add -D '
    default:
      return 'npm install -D '
  }
})

onKeyStroke(['Enter', ' ', 'Escape'], (event) => {
  resetPrompt(event)
})

const changelogLink = (version) => {
  return `https://on.cypress.io/changelog#${version.replaceAll('.', '-')}`
}

</script>
