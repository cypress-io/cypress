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
      campaign: 'TODO',
      medium: 'TODO',
      cohort: null
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
mutation SwitchToComponentTesting {
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
}>()

const { t } = useI18n()
const bannerId = BannerIds.CT_052023_AVAILABLE

const title = computed(() => t('specPage.banners.ct.title', [props.framework?.name]))
const iconFromType = computed(() => FrameworkBundlerLogos[props.framework?.type])

const handlePrimary = () => {
  switchToCtAndRelaunch.executeMutation({})
}

const docsLink = getUrlWithParams({
  url: 'https://on.cypress.io/component-testing',
  params: {
    utm_medium: '',
    utm_campaign: '',
  },
})

const surveyLink = getUrlWithParams({
  url: '#',
  params: {
    utm_medium: '',
    utm_campaign: '',
  },
})

</script>
