import { useMutation, useQuery, gql } from '@urql/vue'
import { computed, ref, watchEffect } from 'vue'
import { UseTestingType_TestingTypeDocument, UseTestingType_ActivateTestingTypeDocument } from '../generated/graphql'

gql`
query UseTestingType_TestingType {
  currentProject {
    id
    currentTestingType
    isCTConfigured
    isE2EConfigured
  }
}
`

gql`
mutation UseTestingType_ActivateTestingType($testingType: TestingTypeEnum!) {
  switchTestingTypeAndRelaunch(testingType: $testingType)
}
`

export function useTestingType () {
  const query = useQuery({ query: UseTestingType_TestingTypeDocument })
  const activateTestingTypeMutation = useMutation(UseTestingType_ActivateTestingTypeDocument)
  const viewedTestingType = ref<'e2e' | 'component' | null>(null)

  const activeTestingType = computed(() => query.data.value?.currentProject?.currentTestingType)
  const isCTConfigured = computed(() => query.data.value?.currentProject?.isCTConfigured)
  const isE2EConfigured = computed(() => query.data.value?.currentProject?.isE2EConfigured)

  const showTestingTypePromo = computed(() => {
    // confirm required data has resolved from other computed values
    if (isE2EConfigured.value === undefined && isCTConfigured.value === undefined) {
      return false
    }

    return (viewedTestingType.value === 'e2e' && isE2EConfigured.value === false) ||
    (viewedTestingType.value === 'component' && isCTConfigured.value === false)
  })

  // Initialize 'viewed' testing type when query first resolves
  watchEffect(() => {
    if (!!activeTestingType.value && !viewedTestingType.value) {
      viewedTestingType.value = activeTestingType.value
    }
  })

  async function activateTestingType (testingType: 'e2e' | 'component') {
    return await activateTestingTypeMutation.executeMutation({ testingType })
  }

  async function viewTestingType (testingType: 'e2e' | 'component') {
    const switchingBackToActiveMode = testingType === activeTestingType.value
    const targetModeIsConfigured = testingType === 'e2e' && isE2EConfigured.value || testingType === 'component' && isCTConfigured.value

    if (!switchingBackToActiveMode && targetModeIsConfigured) {
      await activateTestingType(testingType)
    } else {
      viewedTestingType.value = testingType
    }
  }

  return {
    activeTestingType,
    viewedTestingType,
    isCTConfigured,
    isE2EConfigured,
    showTestingTypePromo,
    viewTestingType,
    activateTestingType,
  }
}
