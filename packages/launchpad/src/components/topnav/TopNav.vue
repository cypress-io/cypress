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
      v-if="docsMenuContent === 'main'"
      class="flex p-16px gap-24px"
    >
      <!-- TODO make this its own component -->
      <div
        v-for="list in docsMenu"
        :key="list.title"
        class="min-w-164px"
      >
        <h2 class="font-semibold text-gray-800">
          {{ list.title }}
        </h2>
        <hr class="border-gray-50 my-10px">
        <ul>
          <li
            v-for="item in list.children"
            :key="item.text"
            class="flex items-center text-indigo-500 mb-4px"
          >
            <i-cy-book_x16 class="icon-dark-indigo-500 icon-light-indigo-50" />

            <a
              v-if="!item.changeContent"
              :href="getUrl(item.link)"
              target="_blank"
              class="font-normal ml-4px whitespace-nowrap"
            >{{ item.text }}</a>
            <button
              v-else
              class="font-normal ml-4px whitespace-nowrap"
              @click="docsMenuContent = item.changeContent"
            >
              {{ item.text }}
            </button>
          </li>
        </ul>
      </div>
    </div>
    <div
      v-else
      class="w-484px"
    >
      <div class="relative border-b border-b-gray-50 p-24px">
        {{ t(`topNav.docsMenu.prompts.${docsMenuContent}.title`) }}
        <button
          aria-label="Close"
          class="absolute border-transparent rounded-full p-5px border-1 hover:border-indigo-300 hocus-default right-20px top-10px"
          @click="docsMenuContent= 'main'"
        >
          <i-cy-delete_x12 class="icon-dark-gray-400 w-12px h-12px" />
        </button>
      </div>
      <GrowthMenuContentVue :type="docsMenuContent" />
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
const { t } = useI18n()

const getUrl = (link) => {
  let result = link.url

  if (link.params) {
    result += `?${new URLSearchParams(link.params).toString()}`
  }

  return result
}

const releasesUrl = 'https://github.com/cypress-io/cypress/releases/'

const utm_medium = 'Docs Menu'

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

const docsMenuContent = ref('main')

const docsMenu = [{
  title: t('topNav.docsMenu.gettingStartedTitle'),
  children: [{
    text: t('topNav.docsMenu.firstTest'),
    link: {
      url: 'https://on.cypress.io/writing-first-test',
      params: {
        utm_medium,
        utm_content: 'First Test',
      },
    },
  }, {
    text: t('topNav.docsMenu.testingApp'),
    link: {
      url: 'https://on.cypress.io/testing-your-app',
      params: {
        utm_medium,
        utm_content: 'Testing Your App',
      },
    },
  },
  {
    text: t('topNav.docsMenu.organizingTests'),
    link: {
      url: 'https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests',
      params: {
        utm_medium,
        utm_content: 'Organizing Tests',
      },
    },
  }],
}, {
  title: t('topNav.docsMenu.referencesTitle'),
  children: [{
    text: t('topNav.docsMenu.bestPractices'),
    link: {
      url: 'https://on.cypress.io/best-practices',
      params: {
        utm_medium,
        utm_content: 'Best Practices',
      },
    },
  }, {
    text: t('topNav.docsMenu.configuration'),
    link: {
      url: 'https://on.cypress.io/configuration',
      params: {
        utm_medium,
        utm_content: 'Configuration',
      },
    },
  }, {
    text: t('topNav.docsMenu.api'),
    link: {
      url: 'https://on.cypress.io/api',
      params: {
        utm_medium,
        utm_content: 'API',
      },
    },
  }],
}, {
  title: t('topNav.docsMenu.ciTitle'),
  children: [{
    text: t('topNav.docsMenu.ciSetup'),
    changeContent: 'ci',
    link: {
      url: 'https://on.cypress.io/ci',
      params: {
        utm_medium,
        utm_content: 'Set Up CI',
      },
    },
  }, {
    text: t('topNav.docsMenu.fasterTests'),
    link: {
      url: 'https://on.cypress.io/parallelization',
      params: {
        utm_medium,
        utm_content: 'Parallelization',
      },
    },
  },
  {
    text: t('topNav.docsMenu.smartOrchestration'),
    changeContent: 'orchestration',
    link: {
      url: 'https://docs.cypress.io/guides/dashboard/smart-orchestration',
      params: {
        utm_medium,
        utm_content: 'Smart Orchestration',
      },
    },
  }],
}]

</script>
