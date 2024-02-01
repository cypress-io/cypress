<template>
  <TrackedBanner
    v-if="cohortOption"
    :banner-id="bannerId"
    data-cy="create-organization-banner"
    status="info"
    :title="cohortOption.value"
    class="mb-[16px]"
    :icon="OrganizationIcon"
    dismissible
    :has-banner-been-shown="hasBannerBeenShown"
    :event-data="{
      campaign: 'Set up your organization',
      medium: 'Specs Create Organization Banner',
      cohort: cohortOption.cohort
    }"
  >
    <p class="mb-[24px]">
      {{ t('specPage.banners.createOrganization.content') }}
    </p>

    <Button
      :href="createOrganizationUrl"
      size="32"
      data-cy="create-organization-button"
    >
      <IconGeneralOfficeBuilding
        class="mr-[8px]"
        stroke-color="white"
        fill-color="indigo-500"
      />
      {{ t('specPage.banners.createOrganization.buttonLabel') }}
    </Button>
  </TrackedBanner>
</template>

<script setup lang="ts">
import Button from '@cypress-design/vue-button'
import { IconGeneralOfficeBuilding } from '@cypress-design/vue-icon'
import OrganizationIcon from '~icons/cy/office-building_x16.svg'
import { useI18n } from '@cy/i18n'
import TrackedBanner from './TrackedBanner.vue'
import type { CohortOption } from '@packages/frontend-shared/src/gql-components/composables/useCohorts'
import { BannerIds } from '@packages/types'
import { CreateOrganizationBannerDocument } from '../../generated/graphql'
import { gql, useQuery } from '@urql/vue'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { computed } from 'vue'

gql`
query CreateOrganizationBanner {
  cloudViewer {
    id
    createCloudOrganizationUrl
  }
}
`

const props = defineProps<{
  hasBannerBeenShown: boolean
  cohortOption: CohortOption
}>()

const { t } = useI18n()
const bannerId = BannerIds.ACI_082022_CREATE_ORG

const query = useQuery({ query: CreateOrganizationBannerDocument })

const createOrganizationUrl = computed(() => {
  const baseUrl = query.data?.value?.cloudViewer?.createCloudOrganizationUrl

  if (!baseUrl) {
    return ''
  }

  return getUrlWithParams({
    url: baseUrl,
    params: {
      utm_medium: 'Specs Create Organization Banner',
      utm_campaign: 'Set up your organization',
      utm_content: props.cohortOption.value?.cohort,
    },
  })
})

</script>
