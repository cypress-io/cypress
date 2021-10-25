<template>
  <div v-if="type === 'ci'">
    <div class="p-24px pt-20px">
      <p class="text-gray-600 mb-16px">
        {{ t('topNav.docsMenu.prompts.ci.description') }}
      </p>
      <ul
        class="flex flex-wrap gap-16px"
        data-testid="provider-list"
      >
        <li
          v-for="provider in ciProviders"
          :key="provider.name"
          class
        >
          <Button
            :href="provider.link.url"
            class="w-210px text-gray-800"
            size="lg"
            variant="outline"
          >
            <template #prefix>
              <img
                :src="provider.icon"
                width="14"
              >
            </template>
            {{ provider.name }}
          </Button>
        </li>
        <li>
          <Button
            :href="seeOtherGuidesInfo.url"
            variant="outline"
            size="lg"
            class="w-210px text-gray-800"
          >
            <template #prefix>
              <i-cy-book class="w-16px h-16px icon-dark-gray-500 icon-light-gray-50" />
            </template>
            {{ t('topNav.docsMenu.prompts.ci.seeOtherGuides') }}
          </Button>
        </li>
      </ul>
    </div>
    <a
      href="https://on.cypress.io/ci"
      target="_blank"
      class="box-border flex items-center border border-transparent group py-16px px-24px bg-gray-50 hocus-default outline-transparent"
    >
      <i-cy-infinity-loop_x18 class="icon-dark-indigo-500 mr-20px w-20px h-20px" />
      <div class="flex-grow">
        <p class="text-indigo-500 pb-4px">{{ t('topNav.docsMenu.prompts.ci.intro') }}</p>
        <p class="text-gray-600 text-14px">{{ t('topNav.docsMenu.prompts.ci.learnTheBasics') }}</p>
      </div>
      <i-cy-arrow-outline-right
        class="transition-transform duration-200 ease-in transform icon-dark-gray-400 w-20px h-20px group-hocus:translate-x-2px"
      />
    </a>
  </div>
  <div
    v-else-if="type === 'orchestration'"
    class="p-24px"
  >
    <div class="pb-12px border-b border-b-gray-50 text-14px">
      <div
        class="bg-jade-400 text-white pl-12px pr-3px pt-9px pb-7px mb-12px rounded flex justify-between"
      >
        <span>
          <span class="font-bold">{{ t('topNav.docsMenu.prompts.orchestration.parallelTime') }}</span>
          {{ t('topNav.docsMenu.prompts.orchestration.withParallelization') }}
        </span>
        <div class="border-l border-l-jade-500 border-opacity-50 grid place-content-center w-28px">
          <i-cy-lightning_x16 class="icon-dark-white icon-light-jade-400 w-16px h-16px" />
        </div>
      </div>
      <div
        class="bg-gray-500 text-white pl-12px pr-3px pt-9px pb-7px mb-12px rounded flex justify-between"
      >
        <span>
          <span class="font-bold">{{ t('topNav.docsMenu.prompts.orchestration.noParallelTime') }}</span>
          {{ t('topNav.docsMenu.prompts.orchestration.withoutParallelization') }}
        </span>
        <div class="border-l border-l-gray-600 border-opacity-50 grid place-content-center w-28px">
          <i-cy-dollar_x16 class="icon-dark-white w-16px h-16px" />
        </div>
      </div>
    </div>
    <p class="text-gray-600 mt-20px mb-10px">
      {{ t('topNav.docsMenu.prompts.orchestration.intro') }}
    </p>
    <ul class="text-gray-700">
      <li
        v-for="bullet in orchestrationBullets"
        :key="bullet"
        class="flex py-4px items-center"
      >
        <i-cy-lightning_x16 class="icon-dark-jade-400 icon-light-jade-200 w-16px h-16px mr-10px" />
        {{ bullet }}
      </li>
    </ul>
    <Button
      href="https://on.cypress.io/smart-orchestration"
      size="lg"
      class="mt-12px"
    >
      {{ t('topNav.docsMenu.prompts.orchestration.learnMore') }}
      <template #suffix>
        <i-cy-arrow-right_x16 class="icon-dark-current" />
      </template>
    </Button>
  </div>
</template>

<script setup lang="ts">
import Button from '@cy/components/Button.vue'
import { useI18n } from '@cy/i18n'
const { t } = useI18n()

import CircleCI from '../../../../frontend-shared/src/assets/logos/circleci.svg?url'
import GitHubActions from '../../../../frontend-shared/src/assets/logos/github-actions.svg?url'
import Bitbucket from '../../../../frontend-shared/src/assets/logos/bitbucket.svg?url'
import Gitlab from '../../../../frontend-shared/src/assets/logos/gitlab.svg?url'
import AwsCodeBuild from '../../../../frontend-shared/src/assets/logos/aws-codebuild.svg?url'

defineProps<{
  type: 'ci' | 'orchestration' | 'main',
}>()

const slug = 'ci1'
const utm_medium = 'CI Prompt 1'
const utm_content = 'temp-utm'

const ciProviders = [
  {
    name: 'Circle CI',
    icon: CircleCI,
    link: {
      url: 'https://on.cypress.io/setup-ci-circleci',
      params: {
        utm_medium,
        utm_campaign: 'Circle',
        utm_content,
      },
    },
  },
  {
    name: 'GitHub Actions',
    icon: GitHubActions,
    link: {
      url: 'https://on.cypress.io/github-actions',
      params: {
        utm_medium,
        utm_campaign: 'GitHub',
        utm_content,
      },
    },
  },
  {
    name: 'Bitbucket Pipelines',
    icon: Bitbucket,
    link: {
      url: 'https://on.cypress.io/bitbucket-pipelines',
      params: {
        utm_medium,
        utm_campaign: 'Bitbucket',
        utm_content,
      },
    },
  },
  {
    name: 'GitLab',
    icon: Gitlab,
    link: {
      url: 'https://on.cypress.io/gitlab-ci',
      params: {
        utm_medium,
        utm_campaign: 'GitLab',
        utm_content,
      },
    },
  },
  {
    name: 'AWS CodeBuild',
    icon: AwsCodeBuild,
    link: {
      url: 'https://on.cypress.io/aws-codebuild',
      params: {
        utm_medium,
        utm_campaign: 'AWS',
        utm_content,
      },
    },
  },
]

const seeOtherGuidesInfo = {
  url: 'https://on.cypress.io/setup-ci',
  params: {
    utm_medium,
    utm_campaign: 'Other',
    utm_content,
  },
}

const orchestrationBullets = [
  t('topNav.docsMenu.prompts.orchestration.bullet1'),
  t('topNav.docsMenu.prompts.orchestration.bullet2'),
  t('topNav.docsMenu.prompts.orchestration.bullet3'),
]
</script>
