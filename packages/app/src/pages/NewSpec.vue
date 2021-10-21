<template>
  <div>
    <h2>New Spec</h2>
    <div class="flex">
      <Button
        :disabled="!newSpecQuery.data.value?.app.activeProject?.storybook"
        @click="codeGenTypeClicked('story')"
      >
        Generate From Story
      </Button>
      <Button @click="codeGenTypeClicked('component')">
        Generate From Component
      </Button>
    </div>
    <template v-if="codeGenType">
      <div>
        <label for="glob-pattern">Glob Pattern: </label>
        <input
          id="glob-pattern"
          v-model="codeGenGlob"
        >
      </div>
      <div>
        <ul>
          <li
            v-for="candidate of codeGenCandidates"
            :key="candidate.relative"
            class="group"
            @click="candidateClick(candidate.absolute)"
          >
            <span class="text-indigo-600 font-medium">{{ candidate.fileName }}</span>
            <span class="font-light text-gray-400">{{
              candidate.fileExtension
            }}</span>
            <span
              class="font-light text-gray-400 pl-16px hidden group-hover:inline"
            >{{ candidate.relativeFromProjectRoot }}</span>
          </li>
        </ul>
        <div
          v-if="candidateChosen && generatedSpec"
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
    </template>
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
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  NewSpec_NewSpecQueryDocument,
  NewSpec_SearchCodeGenCandidatesDocument,
  NewSpec_CodeGenGlobQueryDocument,
  NewSpec_GenerateSpecFromStoryDocument,
  NewSpec_SetCurrentSpecDocument,
  CodeGenType,
} from '../generated/graphql'

gql`
query NewSpec_NewSpecQuery {
  app {
    activeProject {
      id
      storybook {
        id
      }
      generatedSpec {
        id
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

gql`
query NewSpec_CodeGenGlobQuery($type: CodeGenType!) {
  app {
    activeProject {
      id
      codeGenGlob: codeGenGlob(type: $type)
    }
  }
}
`

gql`
fragment NewSpec_CodeGenCandidateNode on FilePartsEdge {
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
query NewSpec_SearchCodeGenCandidates($glob: String!) {
  app {
    activeProject {
      id
      codeGenCandidates: codeGenCandidates(first: 25, glob: $glob) {
        edges {
          ...NewSpec_CodeGenCandidateNode
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

gql`
mutation NewSpec_SetCurrentSpec($id: ID!) {
  setCurrentSpec(id: $id)
}
`

const newSpecQuery = useQuery({ query: NewSpec_NewSpecQueryDocument })

const codeGenType = ref<CodeGenType | null>(null)

// Urql allows reactive query variables (ref, computed) but has improper typing
type ReactiveGraphQLVar = any

const codeGenGlobQuery = useQuery({
  query: NewSpec_CodeGenGlobQueryDocument,
  variables: { type: codeGenType as ReactiveGraphQLVar },
  pause: computed(() => !codeGenType.value),
})
// Query 'pause' with computed property was triggering an infinite loop so use ref and watch instead
const codeGenGlob = ref('')

watch(codeGenGlobQuery.data, (value, prevVal) => {
  if (value?.app.activeProject?.codeGenGlob && value.app.activeProject.codeGenGlob !== prevVal?.app.activeProject?.codeGenGlob) {
    codeGenGlob.value = value.app.activeProject.codeGenGlob
  }
})

const searchCodeGenCandidates = useQuery({
  query: NewSpec_SearchCodeGenCandidatesDocument,
  variables: { glob: codeGenGlob as ReactiveGraphQLVar },
  pause: computed(() => !codeGenGlob.value),
})
const codeGenCandidates = computed(() => {
  return (
    searchCodeGenCandidates.data.value?.app.activeProject?.codeGenCandidates?.edges.map(
      ({ node: story }) => {
        return {
          ...story,
          fileExtension: story.baseName.replace(story.fileName, ''),
          relativeFromProjectRoot: story.relative.replace(story.baseName, ''),
        }
      },
    ) || []
  )
})

const mutation = useMutation(NewSpec_GenerateSpecFromStoryDocument)
const candidateChosen = ref(false)
const generatedSpec = computed(
  () => newSpecQuery.data.value?.app.activeProject?.generatedSpec,
)

const setSpecMutation = useMutation(NewSpec_SetCurrentSpecDocument)
const router = useRouter()

async function specClick () {
  const specId = newSpecQuery.data.value?.app.activeProject?.generatedSpec?.spec.id

  if (!specId) {
    return
  }

  await setSpecMutation.executeMutation({ id: specId })
  router.push('runner')
}

function codeGenTypeClicked (type: CodeGenType) {
  codeGenType.value = type
  candidateChosen.value = false
}

function candidateClick (story: string) {
  candidateChosen.value = true
  mutation.executeMutation({ storyPath: story })
}
</script>
