<template>
  <div class="flex flex-col h-full mx-auto text-center max-w-714px justify-center">
    <h2 class="mb-40px text-18px text-gray-900">
      {{ t("runs.connect.title") }}
    </h2>
    <div class="flex gap-32px">
      <div
        v-for="(block, i) in notions"
        :key="i"
      >
        <component
          :is="block.icon"
          class="mx-auto h-120px w-120px"
        />
        <p class="h-48px mt-8px text-gray-600">
          {{ block.description }}
        </p>
      </div>
    </div>
    <CloudConnectButton
      utm-medium="Runs Tab"
      class="mx-auto mt-40px"
    />
  </div>
</template>

<script lang="ts" setup>
import SmartIcon from '~icons/cy/illustration-gear_x120.svg'
import DebugIcon from '~icons/cy/illustration-debug_x120.svg'
import ChartIcon from '~icons/cy/illustration-chart_x120.svg'
import { useI18n } from '@cy/i18n'
import CloudConnectButton from './CloudConnectButton.vue'

const { t } = useI18n()

const notions = [
  {
    icon: SmartIcon,
    description: t('runs.connect.smartText'),
  },
  {
    icon: DebugIcon,
    description: t('runs.connect.debugText'),
  },
  {
    icon: ChartIcon,
    description: t('runs.connect.chartText'),
  },
]
</script>
