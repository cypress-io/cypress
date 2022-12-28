<template>
  <Alert
    :title="t('debugPage.manuallyCancelled')"
    status="warning"
    :icon="ErrorOutlineIcon"
    class="flex flex-col mb-24px w-full"
  >
    <div class="flex items-center">
      <div>{{ t('debugPage.specsSkipped', {n: totalSpecs, totalSkippedSpecs}) }}</div>
      <div
        v-if="cancelledByEmail && cancelledByFullName"
        class="rounded-full font-semibold bg-orange-500 h-3px mx-10px w-3px"
      />
      <div
        v-if="cancelledByEmail && cancelledByFullName"
        class="flex items-center"
      >
        <UserAvatar
          :email="cancelledByEmail"
          class="h-20px mr-7px w-20px"
          data-cy="cancelled-by-user-avatar"
        />
        <div>{{ cancelledByFullName }}</div>
      </div>
      <div
        v-if="cancelledAt"
        class="rounded-full font-semibold bg-orange-500 h-3px mx-10px w-3px"
      />
      <div v-if="cancelledAt">
        {{ dayjs(cancelledAt).utc().format('MMM D, YYYY h:mm A UTC') }}
      </div>
    </div>
  </Alert>
</template>

<script lang="ts" setup>
import UserAvatar from '@packages/frontend-shared/src/gql-components/topnav/UserAvatar.vue'
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'
import Alert from '@cy/components/Alert.vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

dayjs.extend(utc)

defineProps<{
  totalSpecs: number
  totalSkippedSpecs: number
  cancelledAt?: string | null
  cancelledByFullName?: string | null
  cancelledByEmail?: string | null
}>()

</script>
