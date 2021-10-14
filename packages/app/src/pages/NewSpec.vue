<template>
  <div v-if="query.data.value?.app.activeProject?.storybook">
    <h2>New Spec</h2>
    <ul>
      <li
        v-for="story of stories"
        :key="story.relative"
        class="group"
        @click="storyClick(story.absolute)"
      >
        <span class="text-indigo-600 font-medium">{{ story.fileName }}</span>
        <span class="font-light text-gray-400">{{ story.fileExtension }}</span>
        <span class="font-light text-gray-400 pl-16px hidden group-hover:inline">{{ story.relativeFromProjectRoot }}</span>
      </li>
    </ul>
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
import { computed } from 'vue'
import { NewSpecQueryDocument, NewSpec_GenerateSpecFromStoryDocument } from '../generated/graphql'

gql`
fragment StoryNode_NewSpec on FilePartsEdge {
  node {
    id
    relative
    fileName
    baseName
    absolute
  }
}
`

gql`
query NewSpecQuery {
  app {
    activeProject {
      id
      storybook {
        id
        stories: stories(first: 25) {
          edges {
            ...StoryNode_NewSpec
          }
        }
      }
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
  return mutation.executeMutation({ storyPath: story }).then((resp) => {
    window.location.href = `${window.location.origin}/__/#/tests/component/${resp.data}`
  })
}

const stories = computed(() => {
  return query.data.value?.app.activeProject?.storybook?.stories?.edges.map(({ node: story }) => {
    return {
      ...story,
      fileExtension: story.baseName.replace(story.fileName, ''),
      relativeFromProjectRoot: story.relative.replace(story.baseName, ''),
    }
  }) || []
})

</script>
