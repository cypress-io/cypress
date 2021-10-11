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
import { MainQueryDocument, GenerateSpecFromStoryDocument } from '../generated/graphql'

gql`
query MainQuery {
  wizard {
    storybook {
      configured
      stories
    }
  }
}
`

gql`
mutation GenerateSpecFromStory($storyPath: String!) {
  generateSpecFromStory (storyPath: $storyPath) {
    storybook {
      configured,
      generatedSpec
    }
  }
} 
`

const query = useQuery({ query: MainQueryDocument })
const mutation = useMutation(GenerateSpecFromStoryDocument)

async function storyClick (story) {
  await mutation.executeMutation({ storyPath: story })
  const generatedSpec = mutation.data.value?.generateSpecFromStory.storybook?.generatedSpec

  // Runner doesn't pick up new file without timeout, I'm guessing a race condition between file watcher and runner starting
  setTimeout(() => {
    window.location.href = `${window.location.origin}/__/#/tests/component/${generatedSpec}`
  }, 500)
}
</script>
