<template>
  <div
    data-cy="debug-spec-col"
    class="grid flex flex-col px-24px gap-24px self-stretch"
  >
    <div
      data-cy="debug-spec-item"
      class="w-full overflow-hidden flex flex-col items-start box-border bg-white border-1px border-red-600 rounded"
    >
      <div
        data-cy="debug-spec-header"
        class="flex-row border-b-1px border-b-gray-100 items-center rounded-t"
      >
        <span>
          {{ spec.relativePath }}
        </span>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{
  gql: any
  foundInLocalProject: boolean
}>()

interface defaultTestType {
  testName: string
  testDescription: string
}
interface defaultTypes {
  relativePath: string
  failedTests: defaultTestType[]
}

const createTest = (name: string, description: string): defaultTestType => {
  return {
    testName: name,
    testDescription: description,
  }
}

const defaultTest = createTest('Bank Accounts', 'creates new bank account')

const defaults: defaultTypes = {
  relativePath: 'cypress/tests/bankaccounts.spec.ts',
  failedTests: [defaultTest],
}

const spec = computed(() => {
  if (props.gql) {
    return props.gql
  }

  return defaults
})

</script>
