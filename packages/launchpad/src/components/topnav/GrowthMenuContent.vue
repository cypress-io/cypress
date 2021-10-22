<template>
  <div v-if="type === 'ci'">
    <div class="p-24px pt-20px">
      <p class="text-gray-600 mb-16px">
        {{ t('topNav.docsMenu.prompts.ci.description') }}
      </p>
      <ul class="flex flex-wrap gap-12px">
        <li
          v-for="provider in ciProviders"
          :key="provider.name"
          class=""
        >
          <a
            :href="provider.link.url"
            class="flex items-center border rounded gap-12px w-210px h-40px px-16px hocus-default"
          >
            <img
              :src="provider.icon"
              width="14"
            >
            {{ provider.name }}</a>
        </li>
        <li>
          <a
            :href="seeOtherGuidesInfo.url"
            class="flex items-center text-gray-800 border rounded gap-12px w-210px h-40px px-16px hocus-default"
          >
            <i-cy-book class="w-16px h-16px icon-dark-gray-500 icon-light-gray-50" />
            See Other Guides
          </a>
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
        <p class="text-indigo-500 pb-4px">
          Introduction to CI
        </p>
        <p class="text-gray-600 text-14px">
          Learn the basics of running Cypress in CI.
        </p>
      </div>
      <i-cy-arrow-outline-right class="transition-transform duration-200 ease-in transform icon-dark-gray-400 w-20px h-20px group-hocus:translate-x-2px" />
    </a>
  </div>
  <div v-else-if="type === 'orchestration'">
    Orchestration
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@cy/i18n'
const { t } = useI18n()

import CircleCI from '../../../../frontend-shared/src/assets/logos/circleci.svg?url'
import GitHubActions from '../../../../frontend-shared/src/assets/logos/github-actions.svg?url'
import Bitbucket from '../../../../frontend-shared/src/assets/logos/bitbucket.svg?url'
import Gitlab from '../../../../frontend-shared/src/assets/logos/gitlab.svg?url'
import AwsCodeBuild from '../../../../frontend-shared/src/assets/logos/aws-codebuild.svg?url'

defineProps<{
	type: 'ci' | 'orchestration',
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
    name: 'Bitbucket',
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
    name: 'GitLab CI/CD',
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
</script>
