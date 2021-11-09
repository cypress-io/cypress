<template>
  <SidebarTooltip
    v-if="testingType"
    class="flex items-center border border-transparent m-12px p-7px bg-gray-900
    focus:outline-none
    group rounded cursor-pointer overflow-hidden transition-colors duration-300"
    :class="mainStore.navBarExpanded ? undefined : 'hover:border-gray-800'"
    :disabled="mainStore.navBarExpanded"
    tabindex="0"
    data-cy="switch-testing-type"
    @click="showModal = true"
  >
    <SwitchTestingTypeModal
      :show="showModal"
      :gql="props.gql"
      @close="showModal = false"
    />
    <component
      :is="testingType.icon"
      class="
          children:transition children:duration-300
          icon-dark-jade-300 group-hover:icon-dark-white
          icon-light-jade-600 group-hover:icon-light-gray-700
          w-24px
          h-24px
          flex-shrink-0
          mr-20px"
    />
    <span class="flex-grow text-white whitespace-nowrap">
      {{ testingType.name }}
    </span>
    <i-cy-chevron-right_x16
      class="icon-dark-gray-700
          w-16px
          h-16px"
    />
    <template #popper>
      {{ testingType.name }}
    </template>
  </SidebarTooltip>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql } from '@urql/vue'
import type { SwitchTestingTypeButtonFragment } from '../generated/graphql'
import { useMainStore } from '../store'
import SidebarTooltip from './SidebarTooltip.vue'
import SwitchTestingTypeModal from './SwitchTestingTypeModal.vue'
import IconE2E from '~icons/cy/testing-type-e2e_x24'
import IconComponent from '~icons/cy/testing-type-component_x24'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment SwitchTestingTypeButton on Query {
  ...SwitchTestingTypeModal
  currentProject {
    id
    currentTestingType
  }
}
`

const showModal = ref(false)

const props = defineProps<{
  gql: SwitchTestingTypeButtonFragment
}>()

const TESTING_TYPE_MAP = {
  e2e: {
    name: t(`testingType.e2e.name`),
    icon: IconE2E,
  },
  component: {
    name: t(`testingType.component.name`),
    icon: IconComponent,
  },
} as const

const testingType = computed(() => {
  return props.gql.currentProject?.currentTestingType ? TESTING_TYPE_MAP[props.gql.currentProject.currentTestingType] : null
})

const mainStore = useMainStore()

</script>
