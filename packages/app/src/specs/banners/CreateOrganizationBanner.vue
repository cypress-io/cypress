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
    @update:model-value="value => emit('update:modelValue', value)"
  >
    <p class="mb-24px">
      {{ t('specPage.banners.createOrganization.content') }}
    </p>

    <Button
      :prefix-icon="OrganizationIcon"
      prefix-icon-class="icon-dark-indigo-50 icon-light-indigo-500"
      class="mt-24px"
      data-cy="create-organization-button"
      @click="handleButtonClick"
    >
      {{ t('specPage.banners.createOrganization.buttonLabel') }}
    </Button>

    <CloudConnectModals
      v-if="isModalOpen"
      :gql="cloudModalsQuery.data.value!"
      @cancel="handleModalClose"
      @success="handleModalClose"
    />
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
import CloudConnectModals from '../../runs/modals/CloudConnectModals.vue'
import { ref } from 'vue'

gql`
query CreateOrganizationBanner {
  ...CloudConnectModals
}
`

withDefaults(defineProps<{
  modelValue: boolean
}>(), {})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()

const isModalOpen = ref(false)

const cloudModalsQuery = useQuery({ query: CreateOrganizationBannerDocument, pause: true })

async function handleButtonClick () {
  await cloudModalsQuery.executeQuery()

  isModalOpen.value = true
}

function handleModalClose () {
  isModalOpen.value = false
  emit('update:modelValue', false)
}

</script>
