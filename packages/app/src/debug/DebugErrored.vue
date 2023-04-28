<template>
  <Alert
    :title="t('debugPage.incomplete')"
    status="warning"
    :icon="ErrorOutlineIcon"
    class="flex flex-col mb-[24px] w-full"
  >
    <div class="ml-[5px]">
      <ul
        v-for="(error, index) in errors"
        :key="index"
        class="list-disc ml-[25px]"
      >
        <li><pre>{{ error }}</pre></li>
      </ul>
    </div>
    <div class="mt-[20px]">
      {{ t('debugPage.specsSkipped', {n: totalSpecs, totalSkippedSpecs}) }}
    </div>
  </Alert>
</template>

<script lang="ts" setup>
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'
import Alert from '@cy/components/Alert.vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

dayjs.extend(utc)

defineProps<{
  errors?: readonly string[]
  totalSpecs: number
  totalSkippedSpecs: number
}>()

</script>
