<template>
  <TrackedBanner
    :banner-id="bannerId"
    :model-value="modelValue"
    data-cy="connect-project-banner"
    status="info"
    :title="t('specPage.banners.connectProject.title')"
    class="mb-16px"
    :icon="ConnectIcon"
    dismissible
    :has-banner-been-shown="hasBannerBeenShown"
    :event-data="{
      campaign: 'Create project',
      medium: 'Specs Create Project Banner',
      cohort: optionSelected.cohort
    }"
    @update:model-value="value => emit('update:modelValue', value)"
  >
    <p class="mb-24px">
      {{ bodyCopy }}
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
import TrackedBanner, { CohortOption, getOptionForCohort } from './TrackedBanner.vue'
import { BannerIds } from '@packages/types'
import { ref, computed } from 'vue'
import { ConnectProjectBannerDocument } from '../../generated/graphql'
import CloudConnectModals from '../../runs/modals/CloudConnectModals.vue'

gql`
query ConnectProjectBanner {
  ...CloudConnectModals
}
`

const props = withDefaults(defineProps<{
  modelValue: boolean
  hasBannerBeenShown: boolean
  bodyCopyOptions?: CohortOption[]
}>(), {
  modelValue: false,
  hasBannerBeenShown: true,
  bodyCopyOptions: () => {
    return [
      { cohort: 'A', value: 'specPage.banners.connectProject.contentA' },
      { cohort: 'B', value: 'specPage.banners.connectProject.contentB' },
    ]
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()
const bannerId = BannerIds.ACI_082022_CONNECT_PROJECT
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

const optionSelected = getOptionForCohort(bannerId, props.bodyCopyOptions)

const bodyCopy = computed(() => {
  return optionSelected.value?.value ? t(optionSelected.value.value) : ''
})

</script>
