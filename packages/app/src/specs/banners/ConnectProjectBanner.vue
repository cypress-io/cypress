<template>
  <TrackedBanner
    :banner-id="BannerIds.ACI_082022_CONNECT_PROJECT"
    :model-value="modelValue"
    data-cy="connect-project-banner"
    status="info"
    :title="t('specPage.banners.connectProject.title')"
    class="mb-16px"
    :icon="ConnectIcon"
    dismissible
    @update:model-value="value => emit('update:modelValue', value)"
  >
    <p class="mb-24px">
      {{ t('specPage.banners.connectProject.content') }}
    </p>

    <Button
      :prefix-icon="ConnectIcon"
      class="mt-24px"
      data-cy="connect-project-button"
      @click="handleButtonClick"
    >
      {{ t('specPage.banners.connectProject.buttonLabel') }}
    </Button>

    <CloudConnectModals
      v-if="isProjectConnectOpen && cloudModalsQuery.data.value"
      :gql="cloudModalsQuery.data.value"
      @cancel="handleModalClose"
      @success="handleModalClose"
    />
  </TrackedBanner>
</template>

<script setup lang="ts">
import { gql, useQuery } from '@urql/vue'
import ConnectIcon from '~icons/cy/chain-link_x16.svg'
import { useI18n } from '@cy/i18n'
import Button from '@cy/components/Button.vue'
import TrackedBanner from './TrackedBanner.vue'
import { BannerIds } from './index'
import { ref } from 'vue'
import { ConnectProjectBannerDocument } from '../../generated/graphql'
import CloudConnectModals from '../../runs/modals/CloudConnectModals.vue'

gql`
query ConnectProjectBanner {
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
const isProjectConnectOpen = ref(false)

const cloudModalsQuery = useQuery({ query: ConnectProjectBannerDocument, pause: true })

async function handleButtonClick () {
  await cloudModalsQuery.executeQuery()

  isProjectConnectOpen.value = true
}

function handleModalClose () {
  isProjectConnectOpen.value = false
  emit('update:modelValue', false)
}

</script>
