<template>
  <TopNavList v-if="versionList">
    <template #heading>
      {{ versionList[0].version }}
    </template>
    <TopNavListItem
      v-for="(item, index) in versionList"
      :key="item.version"
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
        check
      </template>
    </TopNavListItem>
    <TopNavListItem class="text-center p-4">
      <a :href="releasesUrl">See all releases</a>
    </TopNavListItem>
  </TopNavList>

  <TopNavList v-if="browsers">
    <template #heading>
      browser
    </template>
    <TopNavListItem
      v-for="browser in browsers"
      :key="browser.id"
    >
      <template #prefix>
        icon
      </template>
      <span>{{ browser.displayName }}</span>
      <template #suffix>
        append
      </template>
    </TopNavListItem>
  </TopNavList>

  <TopNavList variant="panel">
    <template #heading="{ open }">
      <div class="flex items-center gap-2 group-hocus:text-indigo-600">
        <i-cy-life-ring_x16
          class="icon-dark-gray-500 icon-light-gray-100 group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50 h-16px w-16px"
        />
        <span>Docs {{ open }}</span>
        <i-cy-chevron-down
          class="w-2.5 transform"
          :class="open ? 'rotate-180' : ''"
        />
      </div>
    </template>
    <div class="flex gap-24px">
      <div
        v-for="list in docsMenu"
        :key="list.title"
        class="min-w-164px"
      >
        <h2 class="text-gray-800 font-semibold">
          {{ list.title }}
        </h2>
        <hr class="border-gray-50 my-2.5">
        <ul>
          <li
            v-for="item in list.children"
            :key="item.text"
            class="text-indigo-500 flex mb-2 items-center"
          >
            <i-cy-book_x16 class="icon-dark-indigo-500 icon-light-indigo-50" />
            <a
              :href="getUrl(item.link)"
              class="whitespace-nowrap font-normal ml-2"
            >{{ item.text }}</a>
          </li>
        </ul>
      </div>
    </div>
  </TopNavList>
</template>

<script setup lang="ts">

import { gql, useQuery } from '@urql/vue'
import _ from 'lodash'

import TopNavListItem from './TopNavListItem.vue'
import TopNavList from './TopNavList.vue'

import { TopNavDocument } from '../../generated/graphql'
import { computed } from 'vue'

gql`
query TopNav {
  app {
    ...OpenBrowserList
  }
}
`

const query = useQuery({ query: TopNavDocument })
const browsers = computed(() => query?.data?.value?.app?.browsers)

const getUrl = (link) => {
  let result = link.url

  if (link.params) {
    result += `?${new URLSearchParams(link.params).toString()}`
  }

  return result
}

// will come from gql
const versionList = [
  {
    version: '8.4.1',
    released: '2 days ago',
  },
  {
    version: '8.4.1',
    released: '2 days ago',
  },
  {
    version: '8.4.1',
    released: '2 days ago',
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
