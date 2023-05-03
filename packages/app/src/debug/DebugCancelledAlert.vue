<template>
  <Alert
    :title="t('debugPage.manuallyCancelled')"
    status="warning"
    :icon="ErrorOutlineIcon"
    class="flex flex-col mb-[24px] w-full"
  >
    <div class="flex items-center">
      <div>{{ t('debugPage.specsSkipped', {n: totalSpecs, totalSkippedSpecs}) }}</div>
      <template v-if="cancellation.cancelledBy?.email && cancellation.cancelledBy.fullName">
        <div class="rounded-full font-semibold bg-orange-500 h-[3px] mx-[10px] w-[3px]" />
        <div class="flex items-center">
          <UserAvatar
            :email="cancellation.cancelledBy.email"
            class="h-[20px] mr-[7px] w-[20px]"
            data-cy="cancelled-by-user-avatar"
          />
          <div>{{ cancellation.cancelledBy.fullName }}</div>
        </div>
      </template>
      <template v-if="cancellation.cancelledAt">
        <div class="rounded-full font-semibold bg-orange-500 h-[3px] mx-[10px] w-[3px]" />
        <div>
          {{ dayjs(cancellation.cancelledAt).local().format('MMM D, YYYY h:mm A') }}
        </div>
      </template>
    </div>
  </Alert>
</template>

<script lang="ts" setup>
import UserAvatar from '@packages/frontend-shared/src/gql-components/topnav/UserAvatar.vue'
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'
import Alert from '@cy/components/Alert.vue'
import { dayjs } from '../runs/utils/day'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

defineProps<{
  totalSpecs: number
  totalSkippedSpecs: number
  cancellation: {
    cancelledAt?: string | null
    cancelledBy: {
      fullName?: string | null
      email?: string | null
    } | null
  }
}>()

</script>
