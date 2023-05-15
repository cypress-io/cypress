<template>
  <TrackedBanner
    v-if="cohortOption"
    :banner-id="bannerId"
    data-cy="connect-project-banner"
    status="info"
    :title="t('specPage.banners.connectProject.title')"
    class="mb-[16px]"
    :icon="IconObjectChainLink"
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
      size="32"
      class="mt-[24px] gap-[8px]"
      data-cy="connect-project-button"
      @click="openLoginConnectModal({utmMedium: 'Specs Create Project Banner' })"
    >
      <IconObjectChainLink />
      {{ t('specPage.banners.connectProject.buttonLabel') }}
    </Button>
  </TrackedBanner>
</template>

<script setup lang="ts">
import { useI18n } from '@cy/i18n'
import Button from '@cypress-design/vue-button'
import { IconObjectChainLink } from '@cypress-design/vue-icon'
import TrackedBanner from './TrackedBanner.vue'
import type { CohortOption } from '@packages/frontend-shared/src/gql-components/composables/useCohorts'
import { BannerIds } from '@packages/types'
import { useUserProjectStatusStore } from '@packages/frontend-shared/src/store/user-project-status-store'

const { openLoginConnectModal } = useUserProjectStatusStore()

defineProps<{
  hasBannerBeenShown: boolean
  cohortOption: CohortOption
}>()

const { t } = useI18n()
const bannerId = BannerIds.ACI_082022_CONNECT_PROJECT

</script>
