<template>
  <div
    class="flex flex-col items-center"
  >
    <LockedProject :class="iconClasses" />
    <span class="font-medium mt-24px text-gray-900">
      {{ copy.title }}
    </span>
    <span class="mt-10px text-center text-gray-600">
      {{ copy.message }}
    </span>
    <Button
      size="lg"
      class="mt-25px"
      :href="actionUrl"
    >
      {{ copy.actionLabel }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import LockedProject from '~icons/cy/locked-project_x48.svg'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import type { OverLimitActionTypeEnum } from '../generated/graphql'
import { getUtmSource } from '@packages/frontend-shared/src/utils/getUtmSource'
import { useI18n } from '@cy/i18n'
import { getUrlWithParams } from '@packages/frontend-shared/src/utils/getUrlWithParams'
import { computed } from '@vue/reactivity'

export type DataRetentionLimitExceeded = { __typename: 'DataRetentionLimitExceeded', dataRetentionDays: number | null }

export type UsageLimitExceeded = | { __typename: 'UsageLimitExceeded', monthlyTests: number | null }

export type CloudRunHidingReason = DataRetentionLimitExceeded | UsageLimitExceeded

const { t } = useI18n()

const props = defineProps<{
  overLimitReason: CloudRunHidingReason | null
  overLimitActionType: OverLimitActionTypeEnum
  overLimitActionUrl: string
  runAgeDays: number
}>()

const actionUrl = computed(() => {
  return getUrlWithParams({ url: props.overLimitActionUrl, params: { utmMedium: 'Debug Tab', utmSource: getUtmSource() } })
})

const iconClasses = computed(() => {
  return [
    'icon-dark-gray-500',
    {
      'icon-dark-secondary-jade-400': props.overLimitReason?.__typename !== 'DataRetentionLimitExceeded',
      'icon-light-secondary-jade-200': props.overLimitReason?.__typename !== 'DataRetentionLimitExceeded',
      'icon-dark-secondary-orange-400': props.overLimitReason?.__typename === 'DataRetentionLimitExceeded',
      'icon-light-secondary-orange-200': props.overLimitReason?.__typename === 'DataRetentionLimitExceeded',
    },
  ]
})
const copy = computed(() => {
  if (props.overLimitReason?.__typename === 'DataRetentionLimitExceeded') {
    return {
      title: t('debugPage.overLimit.retentionExceededTitle'),
      message: t('debugPage.overLimit.retentionExceededMessage', { limitDays: props.overLimitReason.dataRetentionDays, runAgeDays: props.runAgeDays }),
      actionLabel: props.overLimitActionType === 'CONTACT_ADMIN' ? t('debugPage.overLimit.contactAdmin') : t('debugPage.overLimit.upgradePlan'),
    }
  }

  return {
    title: t('debugPage.overLimit.usageExceededTitle'),
    message: props.overLimitActionType === 'CONTACT_ADMIN' ? t('debugPage.overLimit.usageExceededUserMessage', { numberTests: props.overLimitReason?.monthlyTests || 0 }) : t('debugPage.overLimit.usageExceededAdminMessage', { numberTests: props.overLimitReason?.monthlyTests || 0 }),
    actionLabel: props.overLimitActionType === 'CONTACT_ADMIN' ? t('debugPage.overLimit.contactAdmin') : t('debugPage.overLimit.upgradePlan'),
  }
})

</script>
