<template>
  <div class="max-w-4xl mx-auto text-center">
    <button
      :key="type.id"
      v-for="type of testingTypes"
      class="block h-45 border border-gray-200 m-5 p-2 rounded md:h-100 md:w-2/5 md:p-9 md:inline-block"
      @click="selectTestingType(type.id)"
    >
      <img
        :src="type.icon"
        class="float-left m-5 md:mx-auto md:mb-10 md:float-none"
      />
      <p class="text-indigo-700 text-left mt-3 md:text-center">{{ type.name }}</p>
      <p class="text-gray-400 text-sm text-left md:text-center" v-html="type.description" />
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { useMutation } from "@vue/apollo-composable"
import { gql } from '@apollo/client/core'
import { SetTestingTypeDocument } from '../generated/graphql'
import { TestingType, testingTypes } from "../utils/testingTypes";
import { useStoreApp } from "../store/app";

gql`
mutation setTestingType ($input: SetTestingTypeInput!) {
  setTestingType (input: $input) {
    projectRoot
    testingType
  }
}
`

gql`
mutation plugins {
  initializePlugins {
    plugins {
			state
    }
  }
}
`

gql`
mutation server {
  initializeServer {
    server {
      state
      message
    } 
  }
}
`

gql`
# set browsr
# hard-coded for now
mutation setBrowser {
	setBrowser (input: { path: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" }) {
    name
  }
}
`

export default defineComponent({
  setup() {
    const storeApp = useStoreApp();
    // const storeConfig = useStoreConfig();
    const testingType = ref<Cypress.TestingType>('e2e')

    const { mutate: setTestingType, onDone: onSetTestingType } = useMutation(
      SetTestingTypeDocument, () => ({
      variables: {
        input: {
          testingType: testingType.value
        }
      }
    }))

    onSetTestingType(result => {
      console.log(result)
      const testingType = result.data.setTestingType.testingType
    })

    onMounted(() => {
      storeApp.setMeta({
        title: "Welcome to Cypress",
        description: "Choose which method of testing you would like to set up first.",
      });
    });

    const selectTestingType = (testingType: TestingType) => {
      setTestingType({ input: { testingType } })
    };

    return { testingTypes, selectTestingType };
  },
});
</script>
