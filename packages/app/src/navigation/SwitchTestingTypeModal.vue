<template>
  <div>
    <div>E2E</div>
    <div>CT</div>
  </div>
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
