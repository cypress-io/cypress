<template>
  <div v-if="query.data.value?.wizard.storybook">
    <h2>New Spec</h2>
    <ul v-if="stories.length">
      <li
        v-for="story of stories"
        :key="story.relative"
        @click="storyClick(story.absolute)"
      >
        <span class="text-indigo-600 font-medium">{{ story.fileName }}</span>
        <span class="font-light text-gray-400">{{ story.fileExtension }}</span>
        <span class="font-light text-gray-400 pl-16px show-on-hover">{{ story.relativeFromProjectRoot }}</span>
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
import { computed } from 'vue-demi'
import { NewSpecQueryDocument, NewSpec_GenerateSpecFromStoryDocument } from '../generated/graphql'

gql`
query NewSpecQuery {
  wizard {
    storybook {
      id
      stories {
        id
        relative
        fileName
        baseName
        absolute
      }
    }
  }
}
`

gql`
mutation NewSpec_GenerateSpecFromStory($storyPath: String!) {
  generateSpecFromStory (storyPath: $storyPath) {
    storybook {
      generatedSpec
    }
  }
} 
`

const query = useQuery({ query: NewSpecQueryDocument })
const mutation = useMutation(NewSpec_GenerateSpecFromStoryDocument)

async function storyClick (story: string) {
  await mutation.executeMutation({ storyPath: story })
  const generatedSpec = mutation.data.value?.generateSpecFromStory.storybook?.generatedSpec

  // Runner doesn't pick up new file without timeout, I'm guessing a race condition between file watcher and runner starting
  setTimeout(() => {
    window.location.href = `${window.location.origin}/__/#/tests/component/${generatedSpec}`
  }, 500)
}

const stories = computed(() => {
  return query.data.value?.wizard.storybook?.stories.map((story) => {
    return {
      ...story,
      fileExtension: story.baseName.replace(story.fileName, ''),
      relativeFromProjectRoot: story.relative.replace(story.baseName, ''),
    }
  }) || []
})

</script>

<style>
.show-on-hover {
  display: none;
}
li:hover .show-on-hover {
  display: inline;
}
</style>
