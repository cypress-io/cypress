<template>
  <a
    ref="wrapper"
    class="block p-8px flex items-center m-12px bg-gray-900 group rounded cursor-pointer"
    @click="modalStore.open('switchTestingType')"
    @mouseover="placeTooltip();hover=true"
    @mouseout="hover=false"
  >
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
  </a>
  <SidebarTooltip
    v-if="showTooltip"
    :tooltip-top="tooltipTop"
    :name="testingTypeName || 'none'"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql } from '@urql/vue'
import { TESTING_TYPES } from '@packages/types/src'
import type { SwitchTestingTypeButtonFragment } from '../generated/graphql'
import { useMainStore, useModalStore } from '../store'
import SidebarTooltip from './SidebarTooltip.vue'
import IconE2E from '~icons/cy/testing-type-e2e_x24'
import IconComponent from '~icons/cy/testing-type-component_x24'

const modalStore = useModalStore()

gql`
fragment SwitchTestingTypeButton on App {
  activeTestingType
}
`

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

const hover = ref(false)
const tooltipTop = ref(0)

const wrapper = ref<HTMLDivElement | null>(null)

// We cannot do this in onMounted because
// top will changes after the bar is mounted
function placeTooltip () {
  const { y } = wrapper.value?.getBoundingClientRect() || { y: 0 }

  tooltipTop.value = y
}

const mainStore = useMainStore()

const showTooltip = computed(() => hover.value && !mainStore.navBarExpanded)

</script>
