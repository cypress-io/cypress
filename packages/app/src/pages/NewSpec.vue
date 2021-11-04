<template>
  <div class="flex flex-col">
    <h2>New Spec</h2>
    <div class="flex gap-4 justify-center">
      <Button
        :disabled="!newSpecQuery.data.value?.currentProject?.storybook"
        @click="codeGenTypeClicked('story')"
      >
        Generate From Story
      </Button>
      <Button @click="codeGenTypeClicked('component')">
        Generate From Component
      </Button>
      <Button @click="codeGenTypeClicked('integration')">
        Generate Integration
      </Button>
    </div>
    <template v-if="codeGenType">
      <template v-if="codeGenType !== 'integration'">
        <div class="p-16px">
          <Input
            id="glob-pattern"
            v-model="codeGenGlob"
          />
        </div>
        <ul class="p-16px max-h-210px overflow-auto">
          <li
            v-for="candidate of codeGenCandidates"
            :key="candidate.relative"
            class="group"
            @click="candidateClick(candidate.absolute)"
          >
            <span class="text-indigo-600 font-medium">{{
              candidate.fileName
            }}</span>
            <span class="font-light text-gray-400">{{
              candidate.fileExtension
            }}</span>
            <span
              class="font-light text-gray-400 pl-16px hidden group-hover:inline"
            >{{ candidate.relativeFromProjectRoot }}</span>
          </li>
        </ul>
      </template>
      <template v-else-if="codeGenType === 'integration'">
        <div class="flex p-16px gap-4">
          <Input
            id="fileName"
            v-model="fileNameInput"
            class="flex-auto"
          />
          <Button @Click="candidateClick(fileNameInput)">
            Generate Spec
          </Button>
        </div>
      </template>
      <div
        v-if="candidateChosen && generatedSpec"
        class="p-16px flex flex-col items-center"
      >
        <Button @click="specClick">
          {{ generatedSpec.spec.relative }}
        </Button>
        <pre>{{ generatedSpec.content }}</pre>
      </div>
    </template>
  </div>
</template>
<route>
{
  name: "New Spec Page",
  meta: {
    title: "New Spec"
  }
}
</route>
<script lang="ts" setup>
import Button from '@cy/components/Button.vue'
import Input from '@cy/components/Input.vue'
import { gql, useMutation, useQuery } from '@urql/vue'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  NewSpec_NewSpecQueryDocument,
  NewSpec_SearchCodeGenCandidatesDocument,
  NewSpec_CodeGenGlobQueryDocument,
  NewSpec_CodeGenSpecDocument,
  NewSpec_SetCurrentSpecDocument,
  CodeGenType,
} from '../generated/graphql'

gql`
query NewSpec_NewSpecQuery {
  currentProject {
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
`

gql`
query NewSpec_CodeGenGlobQuery($type: CodeGenType!) {
  currentProject {
    id
    codeGenGlob: codeGenGlob(type: $type)
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
  currentProject {
    id
    codeGenCandidates: codeGenCandidates(first: 25, glob: $glob) {
      edges {
        ...NewSpec_CodeGenCandidateNode
      }
    }
  }
}
`

gql`
mutation NewSpec_CodeGenSpec($codeGenCandidate: String!, $type: CodeGenType!) {
  codeGenSpec(codeGenCandidate: $codeGenCandidate, type: $type)
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
  if (value?.currentProject?.codeGenGlob && value.currentProject.codeGenGlob !== prevVal?.currentProject?.codeGenGlob) {
    codeGenGlob.value = value.currentProject.codeGenGlob
  }
})

const searchCodeGenCandidates = useQuery({
  query: NewSpec_SearchCodeGenCandidatesDocument,
  variables: { glob: codeGenGlob as ReactiveGraphQLVar },
  pause: computed(() => !codeGenGlob.value),
})
const codeGenCandidates = computed(() => {
  return (
    searchCodeGenCandidates.data.value?.currentProject?.codeGenCandidates?.edges.map(
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

const fileNameInput = ref('')

const mutation = useMutation(NewSpec_CodeGenSpecDocument)
const candidateChosen = ref(false)
const generatedSpec = computed(
  () => newSpecQuery.data.value?.currentProject?.generatedSpec,
)

const setSpecMutation = useMutation(NewSpec_SetCurrentSpecDocument)
const router = useRouter()

async function specClick () {
  const specId = newSpecQuery.data.value?.currentProject?.generatedSpec?.spec.id

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

function candidateClick (codeGenCandidate: string) {
  candidateChosen.value = true
  mutation.executeMutation({
    codeGenCandidate,
    type: codeGenType.value as CodeGenType,
  })
}
</script>
