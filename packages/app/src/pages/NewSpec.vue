<template>
  <div v-if="query.data.value?.app.activeProject?.storybook">
    <h2>New Spec</h2>
    <div>
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
      <div
        v-if="generatedSpec"
        class="p-16px"
      >
        <div class="flex">
          <span>Generated Spec: </span>
          <Button @click="specClick">
            {{ generatedSpec.spec.relative }}
          </Button>
        </div>
        <div>
          <h2>Generated Spec Content:</h2>
          <pre>{{ generatedSpec.content }}</pre>
        </div>
      </div>
    </div>
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
import Button from '@cy/components/Button.vue'
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
  generateSpecFromStory (storyPath: $storyPath) {
    storybook {
      generatedSpec {
        content
        spec {
          id
          name
          relative
        }
      }
    }
  }
} 
`

const query = useQuery({ query: NewSpecQueryDocument })
const mutation = useMutation(NewSpec_GenerateSpecFromStoryDocument)

const generatedSpec = computed(() => mutation.data.value?.generateSpecFromStory.storybook?.generatedSpec)

async function storyClick (story: string) {
  await mutation.executeMutation({ storyPath: story })
}

function specClick () {
  window.location.href = `${window.location.origin}/__/#/tests/component/${generatedSpec.value?.spec.name}`
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
