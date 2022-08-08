<template>
  <TrackedBanner
    :banner-id="BannerIds.ACI_082022_CREATE_ORG"
    :model-value="modelValue"
    data-cy="create-organization-banner"
    status="info"
    :title="t('specPage.banners.createOrganization.title')"
    class="mb-16px"
    :icon="OrganizationIcon"
    dismissible
    @update:model-value="emit('update:modelValue')"
  >
    <p class="mb-24px">
      {{ t('specPage.banners.createOrganization.content') }}
    </p>

    <Button
      :prefix-icon="OrganizationIcon"
      prefix-icon-class="icon-dark-indigo-50 icon-light-indigo-500"
      class="mt-24px"
      data-cy="refresh-button"
      variant="primary"
      :href="query.data.value?.cloudViewer?.createCloudOrganizationUrl || '#'"
    >
      {{ t('specPage.banners.createOrganization.buttonLabel') }}
    </Button>
  </TrackedBanner>
</template>

<script setup lang="ts">
import OrganizationIcon from '~icons/cy/office-building_x16.svg'
import { useI18n } from '@cy/i18n'
import Button from '@cy/components/Button.vue'
import TrackedBanner from './TrackedBanner.vue'
import { BannerIds } from './index'
import { CreateOrganizationBannerDocument } from '../../generated/graphql'
import { gql, useQuery } from '@urql/vue'

gql`
query CreateOrganizationBanner {
  cloudViewer {
    id
    createCloudOrganizationUrl
  }
}
`

withDefaults(defineProps<{
  modelValue: boolean
}>(), {})

const emit = defineEmits<{
  (e: 'update:modelValue'): void
}>()

const { t } = useI18n()

const query = useQuery({ query: CreateOrganizationBannerDocument })

</script>
