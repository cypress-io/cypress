<template>
  <SidebarTooltip
    class="flex items-center border border-transparent m-12px p-7px bg-gray-900 group rounded cursor-pointer overflow-hidden transition-colors duration-300"
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
      :is="testingTypeIcon"
      class="
          children:transition children:duration-800
          icon-dark-jade-300 group-hover:icon-dark-white
          icon-light-jade-600 group-hover:icon-light-gray-700
          w-24px
          h-24px
          flex-shrink-0
          mr-20px"
    />
    <span class="flex-grow text-white whitespace-nowrap">
      {{ testingTypeName }}
    </span>
    <i-cy-chevron-right_x16
      class="icon-dark-gray-700
          w-16px
          h-16px"
    />
    <template #popper>
      {{ testingTypeName }}
    </template>
  </SidebarTooltip>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql } from '@urql/vue'
import { TESTING_TYPES } from '@packages/types/src'
import type { SwitchTestingTypeButtonFragment } from '../generated/graphql'
import { useMainStore } from '../store'
import SidebarTooltip from './SidebarTooltip.vue'
import SwitchTestingTypeModal from './SwitchTestingTypeModal.vue'
import IconE2E from '~icons/cy/testing-type-e2e_x24'
import IconComponent from '~icons/cy/testing-type-component_x24'

gql`
fragment SwitchTestingTypeButton on App {
  activeTestingType
  ...SwitchTestingTypeModal
}
`

const showModal = ref(false)

const props = defineProps<{
  gql: SwitchTestingTypeButtonFragment
}>()

const testingTypeName = computed(() => {
  return TESTING_TYPES.find((tt) => tt.type === props.gql.activeTestingType)?.title
})

const ICONS_MAP = {
  e2e: IconE2E,
  component: IconComponent,
} as const

const testingTypeIcon = computed(() => {
  return props.gql.activeTestingType ? ICONS_MAP[props.gql.activeTestingType] : null
})

const mainStore = useMainStore()

</script>
