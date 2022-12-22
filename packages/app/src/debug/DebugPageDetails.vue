<template>
  <div class="w-full flex flex-col flex-grow justify-center items-center align-middle px-24px">
    <Alert
      v-if="status === 'CANCELLED'"
      title="Manually Canceled"
      status="warning"
      :icon="ErrorOutlineIcon"
      :dismissable="false"
      class="flex flex-col mb-24px w-full"
    >
      {{ totalSkippedCount }} of {{ totalSpecs }} specs skipped • {{ canceledByFullName }} • {{ dayjs(canceledAt).utc().format('MMM D, YYYY h:mm A UTC') }}
    </Alert>
    <div
      v-else-if="status === 'PASSED'"
      class="flex flex-col items-center"
    >
      <DashboardCheckmark />
      <span class="font-bold text-gray-900 mt-24px">
        Well Done!
      </span>
      <span>All your tests passed.</span>
    </div>
    <div v-else-if="status === 'ERRORED'">
      This Errored
    </div>
    <div v-else-if="status === 'NOTESTS'">
      <Alert
        title="Incomplete"
        status="warning"
        :icon="ErrorOutlineIcon"
        :dismissable="false"
        class="flex flex-col mb-24px"
      >
        Run has no tests
      </Alert>
    </div>
    <div v-else-if="status === 'TIMEDOUT'">
      Something happened
    </div>
    <div
      v-else-if="status === 'OVERLIMIT' || isHiddenByUsageLimits"
      class="flex flex-col items-center"
    >
      <LockedProject />
      <span class="font-bold text-gray-900 mt-24px">
        Over plan limit
      </span>
      <span>You've reached the monthly usage limit for your billing plan.</span>
      <span>Update your plan to continue recording runs.</span>
      <Button
        size="lg"
        class="mt-12px"
      >
        <span v-if="overLimitActionType === 'CONTACT_ADMIN'">
          Contact admin
        </span>
        <span v-else>
          Upgrade plan
        </span>
      </Button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import Alert from '@cy/components/Alert.vue'
import { computed } from '@vue/reactivity'
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'
import DashboardCheckmark from '~icons/cy/dashboard-checkmark_x48.svg'
import LockedProject from '~icons/cy/locked-project_x48.svg'
import Button from '@packages/frontend-shared/src/components/Button.vue'
import dayjs from 'dayjs'

const props = defineProps<{
  status: string
  totalSkippedCount: number
  canceledAt: string
  canceledByFullName: string
  isHiddenByUsageLimits: boolean
  overLimitActionType: string
  specs: any[]
}>()

const totalSkippedCount = computed(() => {
  return props.specs.filter((spec) => spec.status === 'UNCLAIMED' || spec.status === 'RUNNING').length
})

const totalSpecs = computed(() => {
  return props.specs.length
})

</script>
