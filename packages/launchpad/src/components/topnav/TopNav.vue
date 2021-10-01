<template>
  <TopNavList v-if="versionList">
    <template #heading="{ open }">
      <i-cy-box_x16
        class="group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50 h-16px w-16px"
        :class="open ? 'icon-dark-indigo-500 icon-light-indigo-50' : 'icon-dark-gray-500 icon-light-gray-100'"
      />
      <span>v{{ versionList[0].version }}</span>
    </template>
    <TopNavListItem
      v-for="(item, index) in versionList"
      :key="item.version"
      class="p-4 min-w-240px"
      :class="index ? '' : 'bg-jade-50'"
    >
      <div class="whitespace-nowrap">
        <a
          :href="`${releasesUrl}/tag/v${item.version}`"
          target="_blank"
        >{{ item.version }}</a>
        <br>
        {{ item.released }}
      </div>
      <template
        v-if="!index"
        #suffix
      >
        <i-cy-circle-check_x24 class="icon-dark-jade-100 icon-light-jade-500" />
      </template>
    </TopNavListItem>
    <TopNavListItem class="p-4 text-center">
      <a
        :href="releasesUrl"
        class="whitespace-nowrap"
      >See all releases</a>
    </TopNavListItem>
  </TopNavList>

  <TopNavList v-if="browserQuery?.data?.value?.app">
    <template #heading="{ open }">
      <img
        class="w-16px filter group-hocus:grayscale-0"
        :class="open ? 'grayscale-0' : 'grayscale'"
        :src="allBrowsersIcons[browserQuery.data.value.app.selectedBrowser.displayName]"
      >
      <span>{{ browserQuery.data.value.app.selectedBrowser.displayName }} v{{ browserQuery.data.value.app.selectedBrowser.majorVersion }}</span>
    </template>
    <TopNavListItem
      v-for="browser in browserQuery.data.value.app.browsers"
      :key="browser.id"
      class="p-4 min-w-240px"
      :class="browser.isSelected ? 'bg-jade-50' : ''"
    >
      <template #prefix>
        <img
          class="mr-4 w-26px"
          :src="allBrowsersIcons[browser.displayName]"
        >
      </template>
      <div>
        <div class="text-indigo-600">
          {{ browser.displayName }}
        </div>
        <div class="font-normal text-gray-500 text-14px">
          Version {{ browser.version }}
        </div>
      </div>
      <template
        v-if="browser.isSelected"
        #suffix
      >
        <div>
          <i-cy-circle-check_x24 class=" icon-dark-jade-100 icon-light-jade-500" />
        </div>
      </template>
    </TopNavListItem>
  </TopNavList>

  <TopNavList variant="panel">
    <template #heading="{ open }">
      <i-cy-life-ring_x16
        class="icon-dark-gray-500 icon-light-gray-100 group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50 h-16px w-16px"
        :class="open ? 'icon-dark-indigo-500 icon-light-indigo-50' : 'icon-dark-gray-500 icon-light-gray-100'"
      />
      <span>Docs</span>
    </template>
    <div class="flex p-4 gap-24px">
      <div
        v-for="list in docsMenu"
        :key="list.title"
        class="min-w-164px"
      >
        <h2 class="font-semibold text-gray-800">
          {{ list.title }}
        </h2>
        <hr class="border-gray-50 my-2.5">
        <ul>
          <li
            v-for="item in list.children"
            :key="item.text"
            class="flex items-center mb-2 text-indigo-500"
          >
            <i-cy-book_x16 class="icon-dark-indigo-500 icon-light-indigo-50" />
            <a
              :href="getUrl(item.link)"
              class="ml-2 font-normal whitespace-nowrap"
            >{{ item.text }}</a>
          </li>
        </ul>
      </div>
    </div>
  </TopNavList>
</template>

<script setup lang="ts">

import _ from 'lodash'
import TopNavListItem from './TopNavListItem.vue'
import TopNavList from './TopNavList.vue'
import { gql, useQuery } from '@urql/vue'
import { TopNavDocument } from '../../generated/graphql'
import { allBrowsersIcons } from '../../../../frontend-shared/src/assets/browserLogos'

gql`
query TopNav {
  app {
    ...DetectedBrowsers
  }
}
`

gql`
fragment DetectedBrowsers on App {
  selectedBrowser {
    id
    displayName
    majorVersion
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

const browserQuery = useQuery({ query: TopNavDocument })

const getUrl = (link) => {
  let result = link.url

  if (link.params) {
    result += `?${new URLSearchParams(link.params).toString()}`
  }

  return result
}

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
]

const releasesUrl = 'https://github.com/cypress-io/cypress/releases/'

const utm_medium = 'Docs Menu'

const docsMenu = [{
  title: 'Getting Started',
  children: [{
    text: 'Write your first test',
    link: {
      url: 'https://on.cypress.io/writing-first-test',
      params: {
        utm_medium,
        utm_content: 'First Test',
      },
    },
  }, {
    text: 'Testing your app',
    link: {
      url: 'https://on.cypress.io/testing-your-app',
      params: {
        utm_medium,
        utm_content: 'Testing Your App',
      },
    },
  },
  {
    text: 'Organizing Tests',
    link: {
      url: 'https://docs.cypress.io/guides/core-concepts/writing-and-organizing-testsp',
      params: {
        utm_medium,
        utm_content: 'Organizing Tests',
      },
    },
  }],
}, {
  title: 'References',
  children: [{
    text: 'Best practices',
    link: {
      url: 'https://on.cypress.io/best-practices',
      params: {
        utm_medium,
        utm_content: 'Best Practices',
      },
    },
  }, {
    text: 'Configuration',
    link: {
      url: 'https://on.cypress.io/configuration',
      params: {
        utm_medium,
        utm_content: 'Configuration',
      },
    },
  }, {
    text: 'API',
    link: {
      url: 'https://on.cypress.io/api',
      params: {
        utm_medium,
        utm_content: 'API',
      },
    },
  }],
}, {
  title: 'Run in CI/CD',
  itemIcon: 'far fa-lightbulb',
  children: [{
    text: 'Set up CI',
    link: {
      url: 'https://on.cypress.io/ci',
      params: {
        utm_medium,
        utm_content: 'Set Up CI',
      },
    },
  }, {
    text: 'Run tests faster',
    link: {
      url: 'https://on.cypress.io/parallelization',
      params: {
        utm_medium,
        utm_content: 'Parallelization',
      },
    },
  },
  {
    text: 'Smart Orchestration',
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
