<template>
  <TrackedBanner
    :banner-id="bannerId"
    data-cy="component-testing-banner"
    status="default"
    :title="title"
    class="mb-[16px]"
    dismissible
    :has-banner-been-shown="hasBannerBeenShown"
    :event-data="{
      campaign: 'CT Available',
      medium: 'Specs CT Available Banner',
      cohort: ''
    }"
  >
    <template #default="{ dismiss }">
      <div class="flex flex-row items-center">
        <component
          :is="iconFromType"
          v-if="!framework?.icon"
          class="flex-shrink-0 h-[60px] w-[60px]"
          data-cy="framework-icon"
        />
        <div
          v-else
          class="flex-shrink-0 h-[60px] w-[60px]"
          data-cy="framework-icon"
          v-html="framework.icon"
        />

        <p class="ml-[16px] max-w-[750px]">
          {{ t('specPage.banners.ct.content') }}
        </p>
      </div>
      <hr class="my-[16px]">
      <div class="flex flex-row items-center text-sm">
        <Button
          data-cy="setup-button"
          variant="outline"
          class="mr-[16px]"
          @click="handlePrimary"
        >
          {{ t('specPage.banners.ct.primaryAction') }}
        </Button>
        <ExternalLink
          data-cy="docs-link"
          :href="docsLink"
        >
          {{ t('specPage.banners.ct.secondaryAction') }}
        </ExternalLink>
        <span class="flex-grow" />
        <ExternalLink
          data-cy="survey-link"
          :href="surveyLink"
          @click="dismiss"
        >
          {{ t('specPage.banners.ct.dismissAction') }}
        </ExternalLink>
      </div>
    </template>
  </TrackedBanner>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { gql, useMutation } from '@urql/vue'
import { useI18n } from '@cy/i18n'
import TrackedBanner from './TrackedBanner.vue'
import { BannerIds } from '@packages/types'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import { FrameworkBundlerLogos } from '@packages/frontend-shared/src/utils/icons'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { SwitchToComponentTestingDocument } from '../../generated/graphql'

gql`
mutation SwitchToComponentTesting($payload: String!) {
  recordEvent(campaign: "Quick setup", medium: "CT Available Banner", messageId: "", identifiers: [machine_id], payload: $payload)
  switchTestingTypeAndRelaunch(testingType: component)
}
`

const switchToCtAndRelaunch = useMutation(SwitchToComponentTestingDocument)

const props = defineProps<{
  hasBannerBeenShown: boolean
  framework: {
    name: string
    icon?: string | null
    type: string
  }
  bundler?: 'vite' | 'webpack'
}>()

const { t } = useI18n()
const bannerId = BannerIds.CT_052023_AVAILABLE

const title = computed(() => t('specPage.banners.ct.title', [props.framework?.name]))
const iconFromType = computed(() => FrameworkBundlerLogos[props.framework?.type])

const handlePrimary = () => {
  switchToCtAndRelaunch.executeMutation({
    payload: JSON.stringify({
      framework: props.framework.name,
      bundler: props.bundler,
    }),
  })
}

const docsLink = computed(() => {
  return getUrlWithParams({
    url: 'https://on.cypress.io/component',
    params: {
      utm_medium: 'CT Available Banner',
      utm_campaign: 'Read the Docs',
      utm_content: [props.framework.name, props.bundler].filter((val) => !!val).join('-'),
    },
  })
})

const surveyLink = computed(() => {
  return getUrlWithParams({
    url: 'https://on.cypress.io/component-survey',
    params: {
      utm_medium: 'CT Available Banner',
      utm_campaign: 'Not Ready',
      utm_content: [props.framework.name, props.bundler].filter((val) => !!val).join('-'),
    },
  })
})

</script>
