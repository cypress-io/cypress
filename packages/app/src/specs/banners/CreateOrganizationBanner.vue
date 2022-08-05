<template>
  <TrackedBanner
    :banner-id="BannerIds.ACI_082022_CREATE_ORG"
    :model-value="modelValue"
    data-cy="create-organization-banner"
    status="info"
    :title="t('specPage.banners.createOrganization.title')"
    class="mb-16px"
    :icon="ConnectIcon"
    dismissible
    @update:model-value="emit('update:modelValue')"
  >
    <p class="mb-24px">
      {{ t('specPage.banners.createOrganization.content') }}
    </p>

    <Button
      :prefix-icon="ConnectIcon"
      class="mt-24px"
      data-cy="refresh-button"
      @click="handleButtonClick"
    >
      {{ t('specPage.banners.createOrganization.buttonLabel') }}
    </Button>
  </TrackedBanner>
</template>

<script setup lang="ts">
import ConnectIcon from '~icons/cy/chain-link_x16.svg'
import { useI18n } from '@cy/i18n'
import Button from '@cy/components/Button.vue'
import TrackedBanner from './TrackedBanner.vue'
import { BannerIds } from './index'

withDefaults(defineProps<{
  modelValue: boolean
}>(), {})

const emit = defineEmits<{
  (e: 'update:modelValue'): void
}>()

const { t } = useI18n()

async function handleButtonClick () {
  // TODO
}

</script>
