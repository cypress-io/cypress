<template>
  <TrackedBanner
    :banner-id="bannerId"
    data-cy="component-testing-banner"
    status="promo"
    :title="title"
    class="mb-[16px]"
    dismissible
    :icon="iconFromType"
    :has-banner-been-shown="hasBannerBeenShown"
    :event-data="{
      campaign: 'CT Available',
      medium: 'Specs CT Available Banner',
      cohort: ''
    }"
  >
    <template #default="{ dismiss, bannerInstanceId }">
      <p class="pb-[16px] text-gray-700">
        {{ t('specPage.banners.componentTesting.content') }}
      </p>
      <div class="flex flex-row items-center text-sm border-t border-gray-100 pt-[8px] -mb-[8px] -mx-[16px] px-[16px]">
        <Button
          data-cy="setup-button"
          variant="outline-indigo"
          size="32"
          class="mr-[16px]"
          @click="handlePrimary(bannerInstanceId)"
        >
          {{ t('specPage.banners.componentTesting.primaryAction') }}
        </Button>
        <ExternalLink
          data-cy="docs-link"
          :href="docsLink"
          @click="handleDocsClick(bannerInstanceId)"
        >
          <span class="font-medium">{{ t('specPage.banners.componentTesting.secondaryAction') }}</span>
        </ExternalLink>
        <span class="flex-grow" />
        <ExternalLink
          data-cy="survey-link"
          :href="surveyLink"
          @click="handleSurveyClick(bannerInstanceId, dismiss)"
        >
          <span class="font-medium">{{ t('specPage.banners.componentTesting.dismissAction') }}</span>
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
import Button from '@cypress-design/vue-button'
import { FrameworkBundlerLogos } from '@packages/frontend-shared/src/utils/icons'
import ExternalLink from '@cy/gql-components/ExternalLink.vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { SwitchToComponentTestingDocument, ComponentTestingAvailable_RecordEventDocument } from '../../generated/graphql'

gql`
mutation SwitchToComponentTesting {
  switchTestingTypeAndRelaunch(testingType: component)
}
`

gql`
mutation ComponentTestingAvailable_RecordEvent($campaign: String!, $messageId: String!, $payload: String!) {
  recordEvent(campaign: $campaign, medium: "CT Available Banner", messageId: $messageId, includeMachineId: true, payload: $payload)
}
`

const switchToCtAndRelaunch = useMutation(SwitchToComponentTestingDocument)
const recordEvent = useMutation(ComponentTestingAvailable_RecordEventDocument)

const props = defineProps<{
  hasBannerBeenShown: boolean
  framework: {
    name: string
    icon?: string | null
    type: string
  }
  bundler?: 'vite' | 'webpack'
  machineId: string | undefined
}>()

const { t } = useI18n()
const bannerId = BannerIds.CT_052023_AVAILABLE

const title = computed(() => t('specPage.banners.componentTesting.title', [props.framework?.name]))
const iconFromType = computed(() => FrameworkBundlerLogos[props.framework?.type])

const handlePrimary = async (bannerInstanceId: string) => {
  await recordCampaignEvent(bannerInstanceId, 'Quick setup')

  await switchToCtAndRelaunch.executeMutation({})
}

const handleDocsClick = async (bannerInstanceId: string) => {
  await recordCampaignEvent(bannerInstanceId, 'Read our guide')
}

const handleSurveyClick = async (bannerInstanceId: string, dismiss: () => Promise<void>) => {
  await recordCampaignEvent(bannerInstanceId, 'Give feedback')

  await dismiss()
}

const recordCampaignEvent = async (bannerInstanceId: string, campaign: string) => {
  await recordEvent.executeMutation({
    campaign,
    messageId: bannerInstanceId,
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
    url: 'https://on.cypress.io/component-survey-q2-23',
    params: {
      utm_medium: 'CT Available Banner',
      utm_campaign: 'Give feedback',
      utm_content: [props.framework.name, props.bundler].filter((val) => !!val).join('-'),
      machine_id: props.machineId ?? '',
    },
  })
})

</script>
