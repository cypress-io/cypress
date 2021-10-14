<template>
  <div v-if="query.data.value?.wizard.storybook?.configured">
    <h2>New Spec</h2>
    <ul v-if="query.data.value.wizard.storybook.stories.length">
      <li
        v-for="story of query.data.value.wizard.storybook.stories"
        :key="story"
        @click="storyClick(story)"
      >
        {{ story }}
      </li>
    </ul>
    <p v-else>
      No Stories Detected
    </p>
  </div>
  <div v-else>
    Storybook is not configured for this project
  </div>
</template>
<route>
{
  name: "New Spec Page"
}
</route>
<script lang="ts" setup>
import { gql, useMutation, useQuery } from '@urql/vue'
import { NewSpecQueryDocument, NewSpec_GenerateSpecFromStoryDocument } from '../generated/graphql'

gql`
query NewSpecQuery {
  wizard {
    storybook {
      configured
      stories
    }
  }
}
`

gql`
mutation NewSpec_GenerateSpecFromStory($storyPath: String!) {
  generateSpecFromStory (storyPath: $storyPath) 
} 
`

const query = useQuery({ query: NewSpecQueryDocument })
const mutation = useMutation(NewSpec_GenerateSpecFromStoryDocument)

function storyClick (story) {
  return mutation.executeMutation({ storyPath: story }).then((data) => {
    window.location.href = `${window.location.origin}/__/#/tests/component/${data.data}`
  })
}
</script>
