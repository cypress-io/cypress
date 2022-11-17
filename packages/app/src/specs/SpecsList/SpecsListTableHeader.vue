<script lang="ts" setup>
import { useI18n } from '@cy/i18n'
import { useLoginConnectStore } from '@packages/frontend-shared/src/store/login-connect-store'
import { computed } from 'vue'
import type { Specs_SpecsListFragment } from '../../generated/graphql'
import { tableGridColumns } from './constants'
import LastUpdatedHeader from '../LastUpdatedHeader.vue'
import SpecHeaderCloudDataTooltip from '../SpecHeaderCloudDataTooltip.vue'

const props = defineProps<{
  gql: Specs_SpecsListFragment
}>()

const isGitAvailable = computed(() => {
  return !(
    props.gql.currentProject?.specs.some(
      (s) => s.gitInfo?.statusType === 'noGitInfo',
    ) ?? false
  )
})

const { t } = useI18n()
const { openLoginConnectModal } = useLoginConnectStore()

// TODO: Do we need this at all
const scrollbarOffset = 0
</script>

<template>
  <div
    class="mb-4 grid children:font-medium children:text-gray-800"
    :style="`padding-right: ${scrollbarOffset + 20}px`"
    :class="tableGridColumns"
  >
    <div
      class="flex items-center justify-between"
      data-cy="specs-testing-type-header"
    >
      {{
        props.gql.currentProject?.currentTestingType === "component"
          ? t("specPage.componentSpecsHeader")
          : t("specPage.e2eSpecsHeader")
      }}
    </div>
    <div class="flex items-center justify-between truncate">
      <LastUpdatedHeader :is-git-available="isGitAvailable" />
    </div>
    <div class="flex items-center justify-end whitespace-nowrap">
      <SpecHeaderCloudDataTooltip
        :gql="props.gql"
        mode="LATEST_RUNS"
        data-cy="latest-runs-header"
        @showLoginConnect="
          openLoginConnectModal({ utmMedium: 'Specs Latest Runs Tooltip' })
        "
      />
    </div>
    <div class="hidden items-center justify-end truncate md:flex">
      <SpecHeaderCloudDataTooltip
        :gql="props.gql"
        mode="AVG_DURATION"
        data-cy="average-duration-header"
        @showLoginConnect="
          openLoginConnectModal({ utmMedium: 'Specs Average Duration Tooltip' })
        "
      />
    </div>
  </div>
</template>
