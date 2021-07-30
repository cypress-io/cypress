<template>
  <div class="max-w-4xl mx-auto text-center">
    <button
      :key="type.id"
      v-for="type of query.data?.value?.wizard?.testingTypes"
      class="block h-45 border border-gray-200 m-5 p-2 rounded md:h-100 md:w-2/5 md:p-9 md:inline-block"
      @click="selectTestingType(type.id)"
    >
      <!-- <img
        :src="type.icon"
        class="float-left m-5 md:mx-auto md:mb-10 md:float-none"
      /> -->
      <p class="text-indigo-700 text-left mt-3 md:text-center">{{ type.id }}</p>
      <p class="text-gray-400 text-sm text-left md:text-center" v-html="'<div>TODO</div>'" />
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { TestingType } from "../utils/testingTypes";
import { useMutation, gql, useQuery } from "@urql/vue";
import { GetTestingTypesDocument, SetTestingTypeDocument } from "../generated/graphql";

gql`
mutation SetTestingType($testingType: TestingTypeEnum!) {
  wizardSetTestingType(type: $testingType) {
    testingType
  }
}
`

gql`
query GetTestingTypes {
  wizard {
    testingTypes {
      id
    }
  }
}
`

export default defineComponent({
  setup() {
    const changeType = useMutation(SetTestingTypeDocument)

    const query = useQuery({
      query: GetTestingTypesDocument
    })

    const selectTestingType = async (testingType: TestingType) => {
      changeType.executeMutation({ testingType })
    };

    return { 
      query, 
      selectTestingType 
    };
  },
});
</script>
