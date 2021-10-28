<template>
  <div class="h-full text-center flex flex-col justify-center max-w-714px mx-auto">
    <p class="text-18px my-40px text-gray-900">
      View your recorded runs from the Cypress Dashboard
    </p>
    <div class="flex gap-32px">
      <div
        v-for="(block, i) in notions"
        :key="i"
      >
        <component
          :is="block.icon"
          class="h-120px w-120px mx-auto"
        />
        <p class="h-48px text-gray-600 mt-8px">
          {{ block.description }}
        </p>
      </div>
    </div>
    <Button
      class="mx-auto my-40px"
      :prefix-icon="isLoggedIn ? ChainIcon : UserIcon"
      prefix-icon-class="icon-dark-white icon-light-transparent"
    >
      {{ isLoggedIn ? t('runs.connect.buttonProject') : t('runs.connect.buttonUser') }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
import SmartIcon from '~icons/cy/illustration-gear_x120.svg'
import DebugIcon from '~icons/cy/illustration-debug_x120.svg'
import ChartIcon from '~icons/cy/illustration-chart_x120.svg'
import UserIcon from '~icons/cy/user-outline_x16.svg'
import ChainIcon from '~icons/cy/chain-link_x16.svg'
import Button from '@cy/components/Button.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

defineProps<{
  isLoggedIn: boolean,
}>()

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
