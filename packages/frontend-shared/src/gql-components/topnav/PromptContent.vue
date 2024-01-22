<template>
  <div v-if="type === 'ci1'">
    <div class="p-[24px] pt-[20px]">
      <p class="mb-[16px] text-gray-600">
        {{ t('topNav.docsMenu.prompts.ci1.description') }}
      </p>
      <ul
        class="flex flex-wrap gap-[16px]"
        data-testid="provider-list"
      >
        <li
          v-for="provider in ciProviders"
          :key="provider.name"
          class
        >
          <Button
            :href="getUrl(provider.link)"
            class="!w-[210px]"
            size="lg"
            variant="outline"
          >
            <template #prefix>
              <img
                :src="provider.icon"
                width="14"
                :alt="`${provider.name} logo`"
              >
            </template>
            {{ provider.name }}
          </Button>
        </li>
        <li>
          <Button
            :href="getUrl(seeOtherGuidesInfo)"
            variant="outline"
            size="lg"
            class="!w-[210px]"
          >
            <template #prefix>
              <i-cy-book class="h-[16px] w-[16px] icon-dark-gray-500 icon-light-gray-50" />
            </template>
            {{ t('topNav.docsMenu.prompts.ci1.seeOtherGuides') }}
          </Button>
        </li>
      </ul>
    </div>
    <ExternalLink
      :href="getUrl({
        url: 'https://on.cypress.io/ci',
        params: {
          utm_medium: utmMedium,
          utm_campaign: 'Learn More',
        },
      })"
      :use-default-hocus="false"
      class="border border-transparent flex outline-transparent bg-gray-50 py-[16px] px-[24px] box-border items-center group hocus-default"
    >
      <i-cy-infinity-loop_x18 class="h-[20px] mr-[20px] w-[20px] icon-dark-indigo-500" />
      <div class="grow">
        <p class="pb-[4px] text-indigo-500">
          {{ t('topNav.docsMenu.prompts.ci1.intro') }}
        </p>
        <p class="text-gray-600 text-[14px]">
          {{ t('topNav.docsMenu.prompts.ci1.learnTheBasics') }}
        </p>
      </div>
      <i-cy-arrow-outline-right
        class="h-[20px] transform transition-transform ease-in w-[20px] duration-200 icon-dark-gray-400 group-hocus:translate-x-[2px]"
      />
    </ExternalLink>
  </div>
  <div
    v-else-if="type === 'orchestration1'"
    class="p-[24px]"
  >
    <div class="border-b border-b-gray-50 pb-[12px] text-[14px]">
      <div
        class="rounded flex bg-jade-400 text-white mb-[12px] w-full pt-[9px]
      pr-[3px] pb-[7px] pl-[12px] transition-all duration-800
      justify-between"
        :class="{'w-[50%]': shrink}"
      >
        <span>
          <span class="font-bold">{{ t('topNav.docsMenu.prompts.orchestration1.parallelTime') }}</span>
          {{ t('topNav.docsMenu.prompts.orchestration1.withParallelization') }}
        </span>
        <div class="border-l border-l-jade-500 border-opacity-50 grid w-[28px] place-content-center">
          <i-cy-lightning_x16 class="h-[16px] w-[16px] icon-dark-white icon-light-jade-400" />
        </div>
      </div>
      <div
        class="rounded flex bg-gray-500 text-white mb-[12px] pt-[9px] pr-[3px] pb-[7px] pl-[12px] justify-between"
      >
        <span>
          <span class="font-bold">{{ t('topNav.docsMenu.prompts.orchestration1.noParallelTime') }}</span>
          {{ t('topNav.docsMenu.prompts.orchestration1.withoutParallelization') }}
        </span>
        <div class="border-l border-l-gray-600 border-opacity-50 grid w-[28px] place-content-center">
          <i-cy-dollar_x16 class="h-[16px] w-[16px] icon-dark-white" />
        </div>
      </div>
    </div>
    <p class="mt-[20px] mb-[10px] text-gray-600">
      {{ t('topNav.docsMenu.prompts.orchestration1.intro') }}
    </p>
    <ul class="text-gray-700">
      <li
        v-for="bullet in orchestrationBullets"
        :key="bullet"
        class="flex py-[4px] items-center"
      >
        <i-cy-lightning_x16 class="h-[16px] mr-[10px] w-[16px] icon-dark-jade-400 icon-light-jade-200" />
        {{ bullet }}
      </li>
    </ul>
    <Button
      :href="getUrl(
        {
          url: 'https://on.cypress.io/smart-orchestration',
          params: {
            utm_medium: utmMedium,
            utm_campaign: 'Learn More',
          },
        })"
      size="lg"
      class="mt-[12px]"
    >
      {{ t('topNav.docsMenu.prompts.orchestration1.learnMore') }}
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
import type { LinkWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { useTimeout } from '@vueuse/core'
import { computed } from 'vue'
import type { DocsMenuVariant } from './DocsMenuContent.vue'
import CircleCI from '@packages/frontend-shared/src/assets/logos/circleci.svg?url'
import GitHubActions from '@packages/frontend-shared/src/assets/logos/github-actions.svg?url'
import Bitbucket from '@packages/frontend-shared/src/assets/logos/bitbucket.svg?url'
import Gitlab from '@packages/frontend-shared/src/assets/logos/gitlab.svg?url'
import AwsCodeBuild from '@packages/frontend-shared/src/assets/logos/aws-codebuild.svg?url'
import ExternalLink from '../ExternalLink.vue'

const props = defineProps<{
  type: DocsMenuVariant
  automatic?: boolean
}>()

const getUrl = (link: LinkWithParams) => {
  return getUrlWithParams(link)
}

const shrink = useTimeout(500)
const utmMedium = 'CI Prompt 1'
const utmContent = computed(() => props.automatic ? 'Automatic' : 'Manual')

const ciProviders = [
  {
    name: 'Circle CI',
    icon: CircleCI,
    link: {
      url: 'https://on.cypress.io/setup-ci-circleci',
      params: {
        utm_medium: utmMedium,
        utm_campaign: 'Circle',
        utm_content: utmContent.value,
      },
    },
  },
  {
    name: 'GitHub Actions',
    icon: GitHubActions,
    link: {
      url: 'https://on.cypress.io/github-actions',
      params: {
        utm_medium: utmMedium,
        utm_campaign: 'GitHub',
        utm_content: utmContent.value,
      },
    },
  },
  {
    name: 'Bitbucket Pipelines',
    icon: Bitbucket,
    link: {
      url: 'https://on.cypress.io/bitbucket-pipelines',
      params: {
        utm_medium: utmMedium,
        utm_campaign: 'Bitbucket',
        utm_content: utmContent.value,
      },
    },
  },
  {
    name: 'GitLab',
    icon: Gitlab,
    link: {
      url: 'https://on.cypress.io/gitlab-ci',
      params: {
        utm_medium: utmMedium,
        utm_campaign: 'GitLab',
        utm_content: utmContent.value,
      },
    },
  },
  {
    name: 'AWS CodeBuild',
    icon: AwsCodeBuild,
    link: {
      url: 'https://on.cypress.io/aws-codebuild',
      params: {
        utm_medium: utmMedium,
        utm_campaign: 'AWS',
        utm_content: utmContent.value,
      },
    },
  },
]

const seeOtherGuidesInfo = {
  url: 'https://on.cypress.io/setup-ci',
  params: {
    utm_medium: utmMedium,
    utm_campaign: 'Other',
    utm_content: utmContent.value,
  },
}

const orchestrationBullets = [
  t('topNav.docsMenu.prompts.orchestration1.bullet1'),
  t('topNav.docsMenu.prompts.orchestration1.bullet2'),
  t('topNav.docsMenu.prompts.orchestration1.bullet3'),
]
</script>
