<template>
  <Button @click="mutation.executeMutation({})">
    Scaffold Integration
  </Button>
  <div v-if="scaffoldedFiles">
    <ul>
      <li
        v-for="file of scaffoldedFiles"
        :key="file.fileParts.absolute"
      >
        {{ file.fileParts.absolute }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { gql, useMutation } from '@urql/vue'
import Button from '@cy/components/Button.vue'
import { ScaffoldGeneratorStepOne_ScaffoldIntegrationDocument } from '../../../generated/graphql'
import { computed } from 'vue'

gql`
mutation ScaffoldGeneratorStepOne_scaffoldIntegration {
  scaffoldIntegration {
    fileParts {
      id
      absolute
    }
  }
}
`

const mutation = useMutation(ScaffoldGeneratorStepOne_ScaffoldIntegrationDocument)
const scaffoldedFiles = computed(() => mutation.data.value?.scaffoldIntegration || [])
</script>
