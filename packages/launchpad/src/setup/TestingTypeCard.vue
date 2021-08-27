<template>
  <button
    :key="testingType.id"
    class="block h-45 border border-gray-200 m-5 p-2 rounded md:h-100 md:w-2/5 md:p-9 md:inline-block"
    @click="selectTestingType"
  >
    <img
      :src="icon"
      class="float-left m-5 md:mx-auto md:mb-10 md:float-none"
    />
    <p class="text-indigo-700 text-left mt-3 md:text-center">
      {{ testingType.title }}
    </p>
    <p 
      class="text-gray-400 text-sm text-left md:text-center" 
      v-html="testingType.description" 
    />
  </button>
</template>

<script setup lang="ts">
import type { TestingTypeInfo } from "@packages/graphql";
import { gql } from '@urql/core'
import { useMutation } from "@urql/vue";
import { TestingTypeCardFragment, TestingTypeSelectDocument } from "../generated/graphql";
import { TestingTypeIcons } from "../utils/icons";

gql`
fragment TestingTypeCard on TestingTypeInfo {
  id
  title
  description
}
`

gql`
mutation TestingTypeSelect($testingType: TestingTypeEnum!) {
  wizardSetTestingType(type: $testingType) {
    step
    testingType
    title
    description
  }
}
`

const mutation = useMutation(TestingTypeSelectDocument)

const props = defineProps<{
  testingType: TestingTypeCardFragment
}>()

const selectTestingType = () => {
  mutation.executeMutation({ testingType: props.testingType.id });
};

const icon = TestingTypeIcons[props.testingType.id]
</script>
