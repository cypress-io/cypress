<template>
  <div class="max-w-4xl mx-auto text-center">
    <button
      :key="type.id"
      v-for="type in testingTypes"
      class="block h-45 border border-gray-200 m-5 p-2 rounded md:h-100 md:w-2/5 md:p-9 md:inline-block"
      @click="selectTestingType(type.id)"
    >
      <img
        :src="icons[type.id]"
        class="float-left m-5 md:mx-auto md:mb-10 md:float-none"
      />
      <p class="text-indigo-700 text-left mt-3 md:text-center">{{ type.title }}</p>
      <p class="text-gray-400 text-sm text-left md:text-center" v-html="type.description" />
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'
import { TestingTypeIcons } from "../utils/icons";
import { TestingTypeSelectDocument, TestingTypeEnum } from '../generated/graphql'

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

gql`
fragment TestingType on Wizard {
  testingTypes {
    id
    title
    description
  }
}
`

export default defineComponent({
  props: ['gql'], // TODO: Figure out better typings in general
  setup(props) {
    const mutation = useMutation(TestingTypeSelectDocument)

    const selectTestingType = (testingType: TestingTypeEnum) => {
      mutation.executeMutation({ testingType });
    };

    return { 
      icons: TestingTypeIcons,
      testingTypes: props.gql.testingTypes, 
      selectTestingType 
    };
  },
});
</script>
