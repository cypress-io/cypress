<template>
  <div class="h-full text-center flex flex-col justify-center max-w-714px mx-auto">
    <h2 class="text-18px mb-40px text-gray-900">
      {{ t("runs.connect.title") }}
    </h2>
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
      class="mx-auto mt-40px"
      :prefix-icon="isLoggedIn ? ChainIcon : UserIcon"
      prefix-icon-class="icon-dark-white icon-light-transparent"
      @click="openConnection"
    >
      {{ isLoggedIn ? t('runs.connect.buttonProject') : t('runs.connect.buttonUser') }}
    </Button>
    <LoginModal
      v-model="isLoginOpen"
      :gql="gql"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import SmartIcon from '~icons/cy/illustration-gear_x120.svg'
import DebugIcon from '~icons/cy/illustration-debug_x120.svg'
import ChartIcon from '~icons/cy/illustration-chart_x120.svg'
import UserIcon from '~icons/cy/user-outline_x16.svg'
import ChainIcon from '~icons/cy/chain-link_x16.svg'
import Button from '@cy/components/Button.vue'
import LoginModal, { LoginModalFragment } from '@cy/gql-components/topnav/LoginModal.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const props = defineProps<{
  isLoggedIn: boolean,
  gql: LoginModalFragment,
}>()

const isLoginOpen = ref(false)

function openConnection () {
  if (props.isLoggedIn) {
    // connect a product
  } else {
    isLoginOpen.value = true
  }
}

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
