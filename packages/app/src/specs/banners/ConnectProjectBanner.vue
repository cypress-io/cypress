<template>
  <TrackedBanner
    v-if="cohortOption"
    :banner-id="bannerId"
    data-cy="connect-project-banner"
    status="info"
    title="Connect your project to Cypress Cloud"
    class="mb-[16px]"
    :icon="ConnectIcon"
    dismissible
    :has-banner-been-shown="hasBannerBeenShown"
    :event-data="{
      campaign: 'Create project',
      medium: 'Specs Create Project Banner',
      cohort: cohortOption.cohort
    }"
  >
    <p class="mb-[24px]">
      {{ cohortOption.value }}
    </p>

    <Button
      :prefix-icon="ConnectIcon"
      class="mt-[24px]"
      data-cy="connect-project-button"
      @click="openLoginConnectModal({utmMedium: 'Specs Create Project Banner' })"
    >
      Connect your project
    </Button>
  </TrackedBanner>
</template>

<script setup lang="ts">
import ConnectIcon from '~icons/cy/chain-link_x16.svg'
import Button from '@cy/components/Button.vue'
import TrackedBanner from './TrackedBanner.vue'
import type { CohortOption } from '@packages/frontend-shared/src/gql-components/composables/useCohorts'
import { BannerIds } from '@packages/types'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'
const { openLoginConnectModal } = useUserProjectStatusStore()

defineProps<{
  hasBannerBeenShown: boolean
  cohortOption: CohortOption
}>()

const bannerId = BannerIds.ACI_082022_CONNECT_PROJECT

</script>
