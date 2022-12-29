<template>
  <div
    class="flex flex-col items-center"
  >
    <LockedProject class="icon-dark-gray-500" />
    <span class="font-medium mt-24px text-gray-900">
      {{ t('debugPage.overPlanLimit') }}
    </span>
    <span class="mt-10px text-gray-600">{{ t('debugPage.reachedMonthlyUsage') }}</span>
    <span class="text-gray-600">{{ t('debugPage.upgradeYourPlan') }}</span>
    <Button
      size="lg"
      class="mt-25px"
      :href="actionUrl"
    >
      {{ overLimitActionType === 'CONTACT_ADMIN' ? t('debugPage.contactAdmin') : t('debugPage.upgradePlan') }}
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

const { t } = useI18n()

const props = defineProps<{
  overLimitActionType: OverLimitActionTypeEnum
  overLimitActionUrl: string
}>()

const actionUrl = computed(() => {
  return getUrlWithParams({ url: props.overLimitActionUrl, params: { utmMedium: 'Debug Tab', utmSource: getUtmSource() } })
})

</script>
