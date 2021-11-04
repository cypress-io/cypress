<template>
  <div class="w-300px overflow-x-hidden">
    <InlineSpecListRow
      v-for="spec in specs"
      :key="spec.node.id"
      :spec="spec.node"
      :selected="isCurrentSpec(spec)"
      tabIndex="0"
      :ref="focusRef"
    >
    </InlineSpecListRow>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { gql } from '@urql/vue'
import type { SpecNode_InlineSpecListFragment, Specs_InlineSpecListFragment } from '../generated/graphql'
import { useSpecStore } from '../store'
import { useRouter } from 'vue-router'
import InlineSpecListRow from './InlineSpecListRow.vue'
const focusRef = ref()
gql`
fragment SpecNode_InlineSpecList on SpecEdge {
  node {
    name
    specType
    absolute
    relative
    baseName
  }
  ...SpecListRow
}
`

gql`
fragment Specs_InlineSpecList on App {
  activeProject {
    id
    projectRoot
    specs: specs(first: 25) {
      edges {
        ...SpecNode_InlineSpecList
      }
    }
  }
}
`

const props = defineProps<{
  gql: Specs_InlineSpecListFragment
}>()

const specStore = useSpecStore()

const isCurrentSpec = (spec: SpecNode_InlineSpecListFragment) => {
  return spec.node.relative === specStore.activeSpec?.relative
}

const specs = computed(() => props.gql.activeProject?.specs?.edges || [])

onMounted(() => {
  document.addEventListener('keydown', ($event) => {
    const keyboardEvent = document.createEvent('KeyboardEvent')
    const initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? 'initKeyboardEvent' : 'initKeyEvent';

    if ($event.key==='ArrowUp') {
      keyboardEvent[initMethod](
        'keydown',
        true,
        true,
        window,
        false,
        false,
        false,
        false,
        9,
        0
      )
    } else if ($event.key==='ArrowDown') {
      keyboardEvent[initMethod](
        'keydown',
        true,
        true,
        window,
        false,
        false,
        true,
        false,
        9,
        0
      )
    }
  })
})

</script>

<style>
.spec-item:hover::before,.selected::before {
  position: absolute;
  content: '';
  width: 8px;
  left: -4px;
  height: 28px;
  @apply border-r-4 border-r-indigo-300 rounded-lg;
}

.test {
  border: solid 1px red
}
</style>
