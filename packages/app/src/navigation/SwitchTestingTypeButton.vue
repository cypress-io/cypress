<template>
  <a
    class="block p-8px flex items-center m-12px bg-gray-900 group rounded cursor-pointer"
    @click="modalStore.open('switchTestingType')"
  >
    <i-cy-testing-type-ct_x24
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
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { gql } from '@urql/vue'
import { TESTING_TYPES } from '@packages/types/src'
import type { SwitchTestingTypeButtonFragment } from '../generated/graphql'
import { useModalStore } from '../store'

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

</script>
