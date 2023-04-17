<template>
  <div
    v-for="list in docsMenu"
    :key="list.title"
    class="min-w-[164px]"
  >
    <h2 class="font-medium text-gray-800">
      {{ list.title }}
    </h2>
    <hr class="border-gray-50 my-[10px]">
    <ul>
      <li
        v-for="item in list.children"
        :key="item.text"
        class="flex mb-[4px] text-indigo-500 items-center"
      >
        <i-cy-book_x16 class="icon-dark-indigo-500 icon-light-indigo-50" />
        <ExternalLink
          v-if="!item.changeContent || !currentProjectExists"
          :href="getUrl(item.link)"
          class="font-normal ml-[4px] whitespace-nowrap"
        >
          {{ item.text }}
        </ExternalLink>
        <button
          v-else
          class="font-normal ml-[4px] whitespace-nowrap hocus-link-default"
          @click="switchToGrowthPrompt(item.changeContent)"
        >
          {{ item.text }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
export type DocsMenuVariant = 'ci1' | 'orchestration1' | 'main'

</script>

<script setup lang="ts">
import { useI18n } from '@cy/i18n'
import type { LinkWithParams } from '../../utils/getUrlWithParams'
import { getUrlWithParams } from '../../utils/getUrlWithParams'
import ExternalLink from '../ExternalLink.vue'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'setDocsContent', value: DocsMenuVariant): void
}>()

defineProps<{
  currentProjectExists: boolean
}>()

const utm_medium = 'Docs Menu'

const switchToGrowthPrompt = (target) => {
  emit('setDocsContent', target)
}

const getUrl = (link: LinkWithParams) => {
  return getUrlWithParams(link)
}

const docsMenu: {
  title: string
  children: {
    text: string
    link: LinkWithParams
    changeContent?: DocsMenuVariant
  }[]
}[] = [{
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
      url: 'https://on.cypress.io/writing-and-organizing-tests',
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
    changeContent: 'ci1',
    link: {
      url: 'https://on.cypress.io/ci',
      params: {
        utm_medium,
        utm_content: 'Set Up CI',
      },
    },
  }, {
    text: t('topNav.docsMenu.fasterTests'),
    changeContent: 'orchestration1',
    link: {
      url: 'https://on.cypress.io/parallelization',
      params: {
        utm_medium,
        utm_content: 'Parallelization',
      },
    },
  }],
}]

</script>
