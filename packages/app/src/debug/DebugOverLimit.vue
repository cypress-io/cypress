<template>
  <div
    class="flex flex-col max-w-[440px] items-center"
  >
    <LockedProject :class="iconClasses" />
    <span class="font-medium mt-[24px] text-lg text-gray-900">
      {{ copy.title }}
    </span>
    <span class="mt-[10px] text-center text-gray-600">
      {{ copy.message }}
    </span>
    <Button
      size="lg"
      class="mt-[25px]"
      :href="actionUrl"
    >
      {{ copy.actionLabel }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import LockedProject from '~icons/cy/locked-project_x48.svg'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import type { DebugReasonsRunIsHiddenFragment, OverLimitActionTypeEnum } from '../generated/graphql'
import { getUtmSource } from '@packages/frontend-shared/src/utils/getUtmSource'
import { useI18n } from '@cy/i18n'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { computed } from 'vue'
import { DEBUG_TAB_MEDIUM } from './utils/constants'

export type CloudRunHidingReason = DebugReasonsRunIsHiddenFragment['reasonsRunIsHidden'][number]

type DataRetentionLimitExceeded = Extract<CloudRunHidingReason, { '__typename': 'DataRetentionLimitExceeded' }>

type UsageLimitExceeded = Extract<CloudRunHidingReason, { '__typename': 'UsageLimitExceeded' }>

gql`
fragment DebugReasonsRunIsHidden on CloudRun {
  id
  reasonsRunIsHidden {
    __typename
    ... on DataRetentionLimitExceeded {
      dataRetentionDays
    }
    ... on UsageLimitExceeded {
      monthlyTests
    }
  }
}
`

const { t } = useI18n()

const props = defineProps<{
  overLimitReasons: (CloudRunHidingReason | null)[]
  overLimitActionType: OverLimitActionTypeEnum
  overLimitActionUrl: string
  runAgeDays: number
}>()

const actionUrl = computed(() => {
  return getUrlWithParams({ url: props.overLimitActionUrl, params: { utmMedium: DEBUG_TAB_MEDIUM, utmSource: getUtmSource() } })
})

const overLimitReason = computed<CloudRunHidingReason>(() => {
  // Prefer showing the "Usage Exceeded" messaging if multiple conditions exist
  return props.overLimitReasons.find(isUsageLimit) || props.overLimitReasons.find(isRetentionLimit) || null
})

const isPlanAdmin = computed(() => props.overLimitActionType === 'UPGRADE')

const iconClasses = computed(() => {
  return [
    'icon-dark-gray-500',
    isRetentionLimit(overLimitReason.value)
      ? 'icon-dark-secondary-orange-400 icon-light-secondary-orange-200'
      : 'icon-dark-secondary-jade-400 icon-light-secondary-jade-200',
  ]
})
const copy = computed(() => {
  if (isRetentionLimit(overLimitReason.value)) {
    return {
      title: t('debugPage.overLimit.retentionExceededTitle'),
      message: t('debugPage.overLimit.retentionExceededMessage', { limitDays: overLimitReason.value.dataRetentionDays, runAgeDays: props.runAgeDays }),
      actionLabel: isPlanAdmin.value ? t('debugPage.overLimit.upgradePlan') : t('debugPage.overLimit.contactAdmin'),
    }
  }

  const numberTests = overLimitReason.value?.monthlyTests || 0

  return {
    title: t('debugPage.overLimit.usageExceededTitle'),
    message: isPlanAdmin.value ? t('debugPage.overLimit.usageExceededAdminMessage', { numberTests }) : t('debugPage.overLimit.usageExceededUserMessage', { numberTests }),
    actionLabel: isPlanAdmin.value ? t('debugPage.overLimit.upgradePlan') : t('debugPage.overLimit.contactAdmin'),
  }
})

function isUsageLimit (reason: CloudRunHidingReason | null | undefined): reason is UsageLimitExceeded {
  return reason?.__typename === 'UsageLimitExceeded'
}

function isRetentionLimit (reason: CloudRunHidingReason | null | undefined): reason is DataRetentionLimitExceeded {
  return reason?.__typename === 'DataRetentionLimitExceeded'
}

</script>
