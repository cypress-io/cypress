<template>
  <SidebarTooltip
    v-if="testingType"
    class="border-b cursor-pointer flex border-gray-900 flex-shrink-0 h-64px pl-20px transition-all duration-300 items-center hover:bg-gray-900"
    :disabled="mainStore.navBarExpanded"
    :popper-top-offset="4"
    popper-class="h-56px"
    data-cy="sidebar-header"
    tabindex="0"
    @click="showModal = true"
    @keydown.enter="showModal = true"
  >
    <SwitchTestingTypeModal
      :show="showModal"
      :gql="props.gql"
      @close="showModal = false"
    />
    <component
      :is="testingType.icon"
      class="
          flex-shrink-0 h-24px
          mr-20px w-24px
          icon-dark-jade-600 icon-light-jade-300
          children:transition
          children:duration-300"
    />
    <div class="text-gray-50 text-size-16px leading-24px truncate">
      {{ props.gql.currentProject?.title ?? 'Cypress' }}
      <p class="text-gray-600 text-size-14px leading-20px truncate">
        {{ props.gql.currentProject?.branch }}
      </p>
    </div>

    <template #popper>
      <div class="text-left text-gray-50 text-size-16px leading-16px truncate">
        {{ props.gql.currentProject?.title ?? 'Cypress' }}
        <p class="text-gray-600 text-size-14px leading-20px truncate">
          {{ props.gql.currentProject?.branch }}
        </p>
      </div>
    </template>
  </SidebarTooltip>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { gql } from '@urql/vue'
import type { SidebarNavigationHeaderFragment } from '../generated/graphql'
import { useMainStore } from '../store'
import SidebarTooltip from './SidebarTooltip.vue'
import SwitchTestingTypeModal from './SwitchTestingTypeModal.vue'
import IconE2E from '~icons/cy/testing-type-e2e-solid-simple'
import IconComponent from '~icons/cy/testing-type-component-solid_x64'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

gql`
fragment SidebarNavigationHeader on Query {
  ...SwitchTestingTypeModal
  currentProject {
    id
    currentTestingType
    title
    branch
  }
}
`

const showModal = ref(false)

const props = defineProps<{
  gql: SidebarNavigationHeaderFragment
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
