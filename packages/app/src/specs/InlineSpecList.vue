<template>
  <div>
    <CreateSpecModal
      v-if="props.gql.currentProject?.currentTestingType"
      :show="showModal"
      :gql="props.gql"
      @close="showModal = false"
    />
    <InlineSpecListHeader
      v-model:specFilterModel="specFilterModel"
      :result-count="specs.length"
      :is-run-all-specs-allowed="runAllSpecsStore.isRunAllSpecsAllowed"
      @newSpec="showModal = true"
      @run-all-specs="runAllSpecsStore.runAllSpecs"
    />
    <InlineSpecListTree
      :specs="specs"
      class="pb-[32px]"
    />
    <!-- Fading top and bottom of the container. It may make sense for this to exist in a css utility or class. -->
    <div class="bg-gradient-to-b to-transparent from-gray-1000 h-[12px] top-[64px] left-0 w-[calc(100%-2px)] scroller-fade absolute" />
    <div class="bg-gradient-to-b from-transparent to-gray-1000 h-[12px] w-full right-0 bottom-[12px] scroller-fade absolute" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { gql } from '@urql/vue'
import type { Specs_InlineSpecListFragment } from '../generated/graphql'
import InlineSpecListHeader from './InlineSpecListHeader.vue'
import InlineSpecListTree from './InlineSpecListTree.vue'
import CreateSpecModal from './CreateSpecModal.vue'
import { fuzzySortSpecs, makeFuzzyFoundSpec, useCachedSpecs } from './spec-utils'
import type { FuzzyFoundSpec } from './tree/useCollapsibleTree'
import { useSpecFilter } from '../composables/useSpecFilter'
import { useRunAllSpecsStore } from '../store/run-all-specs-store'

gql`
fragment SpecNode_InlineSpecList on Spec {
  id
  name
  specType
  absolute
  baseName
  fileName
  specFileExtension
  fileExtension
  relative
}
`

gql`
fragment Specs_InlineSpecList on Query {
  ...CreateSpecModal
  currentProject {
    id
    projectRoot
    currentTestingType
    savedState
    specs {
      id
      ...SpecNode_InlineSpecList
    }
  }
}
`

const props = defineProps<{
  gql: Specs_InlineSpecListFragment
}>()

const showModal = ref(false)

const { debouncedSpecFilterModel, specFilterModel } = useSpecFilter(props.gql.currentProject?.savedState?.specFilter)

const cachedSpecs = useCachedSpecs(computed(() => (props.gql.currentProject?.specs) || []))

const specs = computed<FuzzyFoundSpec[]>(() => {
  const specs = cachedSpecs.value.map((x) => makeFuzzyFoundSpec(x))

  if (!debouncedSpecFilterModel.value) return specs

  return fuzzySortSpecs(specs, debouncedSpecFilterModel.value)
})

const runAllSpecsStore = useRunAllSpecsStore()

</script>
