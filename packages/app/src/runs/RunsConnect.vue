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
      :gql="props.gql"
    />
    <SelectCloudProjectModal
      v-if="props.gql.cloudViewer && isProjectConnectOpen"
      :show="isProjectConnectOpen"
      :gql="props.gql.cloudViewer"
      @cancel="isProjectConnectOpen = false"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql } from '@urql/vue'
import SmartIcon from '~icons/cy/illustration-gear_x120.svg'
import DebugIcon from '~icons/cy/illustration-debug_x120.svg'
import ChartIcon from '~icons/cy/illustration-chart_x120.svg'
import UserIcon from '~icons/cy/user-outline_x16.svg'
import ChainIcon from '~icons/cy/chain-link_x16.svg'
import Button from '@cy/components/Button.vue'
import LoginModal from '@cy/gql-components/topnav/LoginModal.vue'
import { useI18n } from '@cy/i18n'
import type { RunsConnectFragment } from '../generated/graphql'
import SelectCloudProjectModal from './modals/SelectCloudProjectModal.vue'

const { t } = useI18n()

gql`
fragment RunsConnect on Query {
  cloudViewer{
    id
    ...SelectCloudProjectModal
  }
  ...LoginModal
}
`

const props = defineProps<{
  gql: RunsConnectFragment,
}>()

const isLoginOpen = ref(false)
const isProjectConnectOpen = ref(false)
const isLoggedIn = computed(() => Boolean(props.gql.cloudViewer?.id))

function openConnection () {
  if (!isLoggedIn.value) {
    // start logging in the user
    isLoginOpen.value = true
  } else {
    // if user is already logged in connect a cloud project
    isProjectConnectOpen.value = true
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
