<template>
  <div
    data-cy="debug-spec-list"
    class="flex flex-col gap-[24px] self-stretch"
  >
    <TransitionGroupQuickFade>
      <DebugSpec
        v-for="spec in specs"
        :key="spec.spec.id"
        :spec="spec.spec"
        :test-results="spec.tests"
        :testing-type="spec.testingType"
        :groups="spec.groups"
        :found-locally="spec.foundLocally"
        :matches-current-testing-type="spec.matchesCurrentTestingType"
        @switchTestingType="switchTestingType"
      />
    </TransitionGroupQuickFade>
  </div>
</template>

<script setup lang="ts">
import TransitionGroupQuickFade from '@cy/components/transitions/TransitionGroupQuickFade.vue'

import { gql } from '@urql/core'
import { useMutation } from '@urql/vue'
import { computed, watchEffect } from 'vue'
import { SetTestsForDebugDocument, SwitchTestingTypeAndRelaunchDocument, TestingTypeEnum } from '../generated/graphql'
import DebugSpec from './DebugSpec.vue'
import type { CloudDebugSpec } from './utils/DebugMapping'

gql`
fragment DebugSpecListSpec on CloudSpecRun {
  id
  path
  basename
  extension
  shortPath
  groupIds
  specDuration {
    min
    max
  }
  status
  testsPassed {
    min
    max
  }
  testsFailed {
    min
    max
  }
  testsPending {
    min
    max
  }
}
`

gql`
fragment DebugSpecListTests on CloudTestResult {
  id
  specId
  title(depth: 2)
  titleParts
  duration
  isFlaky
  testUrl
  thumbprint
  instance {
    id
    status
    groupId
    totalPassed
    totalFailed
    totalPending
    totalSkipped
    totalRunning
    hasStdout
    stdoutUrl
    hasScreenshots
    screenshotsUrl
    hasVideo
    videoUrl
    hasReplay
    replayUrl
  }
}
`

gql`
fragment DebugSpecListGroups on CloudRunGroup {
  id
  testingType
  groupName
  os {
    id
    name
    nameWithVersion
  }
  browser {
    id
    formattedName
    formattedNameWithVersion
  }
}
`

gql`
  mutation SetTestsForDebug($testsBySpec: [TestsBySpecInput!]!) {
    setTestsForRun (testsBySpec: $testsBySpec)
  }
`

const props = defineProps<{
  specs: CloudDebugSpec[]
}>()

const switchTestingTypeMutation = useMutation(SwitchTestingTypeAndRelaunchDocument)

const setTestsForDebug = useMutation(SetTestsForDebugDocument)

const specs = computed(() => {
  return props.specs.map((specItem) => {
    const fileName = specItem.spec.basename
    const fileExtension = specItem.spec.extension
    const fileNameWithoutExtension = fileName.replace(fileExtension, '')

    return {
      spec: {
        ...specItem.spec,
        id: specItem.spec.id,
        path: specItem.spec.path.replace(fileNameWithoutExtension + fileExtension, ''),
        fileName: fileNameWithoutExtension,
        fileExtension,
        fullPath: specItem.spec.path,
      },
      tests: specItem.tests,
      groups: specItem.groups,
      testingType: specItem.testingType,
      foundLocally: specItem.foundLocally,
      matchesCurrentTestingType: specItem.matchesCurrentTestingType,
    }
  })
})

function switchTestingType (testingType: TestingTypeEnum) {
  switchTestingTypeMutation.executeMutation({ testingType })
}

watchEffect(() => {
  const testsNamesBySpec = props.specs.map((specItem) => {
    return {
      specPath: specItem.spec.path,
      tests: Object.values(specItem.tests)
      .flat()
      .map((test) => {
        return test.titleParts.join(' ')
      }),
    }
  })

  setTestsForDebug.executeMutation({ testsBySpec: testsNamesBySpec })
})

</script>
