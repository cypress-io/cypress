<template>
  <ul
    v-for="spec in specData"
    :key="spec.spec.id"
  >
    <div
      class="flex flex-col mb-10px border-b-gray-100 border"
    >
      <div
        class="inline-flex text-xs"
        :data-cy="`spec-${spec.spec.id}`"
      >
        {{ spec.spec.id }}
      </div>
      <div
        data-cy="failed-tests"
      >
        <div
          v-for="test in spec.tests"
          :key="`test-${test.specId}`"
        >
          <div
            class="flex text-xs"
            :data-cy="`failed-test-${test.specId}-${test.id}`"
          >
            {{ test.specId }}
          </div>
        </div>
      </div>
    </div>
  </ul>
</template>

<script lang="ts" setup>
import { specsList } from './UtilsDebugMapping'
import { computed } from 'vue'

interface Spec {
  id: string
}

interface Test {
  id: string
  specId: string
}

const props = defineProps<{
  specs: Spec[]
  tests: Test[]
}>()

const debugSpecsArray = specsList(props.specs, props.tests) // {specId: spec, tests: []}[]
const specData = computed(() => {
  return debugSpecsArray.map((specItem) => {
    return {
      spec: {
        id: specItem.spec.id,
      },
      tests: specItem.tests,
    }
  })
})

</script>
