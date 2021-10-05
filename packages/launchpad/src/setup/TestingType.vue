<template>
  <div class="max-w-4xl mx-auto text-center">
    <button
      v-for="type of props.gql.testingTypes"
      :key="type.id"
      class="block h-45 border border-gray-200 m-5 p-2 rounded md:h-100 md:w-2/5 md:p-9 md:inline-block"
      @click="selectTestingType(type.type)"
    >
      <img
        :src="TestingTypeIcons[type.id]"
        class="float-left m-5 md:mx-auto md:mb-10 md:float-none"
      >
      <p class="text-indigo-700 text-left mt-3 md:text-center">
        {{ type.title }}
      </p>
      <p
        class="text-gray-400 text-sm text-left md:text-center"
        v-html="type.description"
      />
    </button>
  </div>
</template>

<script lang="ts" setup>
import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'
import { TestingType_SelectDocument, TestingTypeFragment, TestingTypeEnum } from '../generated/graphql'
import { TestingTypeIcons } from '../utils/icons'

gql`
mutation TestingType_Select($testingType: TestingTypeEnum!) {
  wizardSetTestingType(type: $testingType) {
    step
    canNavigateForward
    testingType
    title
    description
    ...TestingType
  }
}
`

gql`
fragment TestingType on Wizard {
  testingTypes {
    id
    type
    title
    description
  }
}
`

const props = defineProps<{
  gql: TestingTypeFragment
}>()

const mutation = useMutation(TestingType_SelectDocument)

const selectTestingType = (testingType: TestingTypeEnum) => {
  mutation.executeMutation({ testingType })
}
</script>
