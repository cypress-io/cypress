<template>
  <Alert
    v-bind="$attrs"
    :model-value="modelValue"
    @update:model-value="handleBannerDismissed"
  >
    <slot />
  </Alert>
</template>

<script setup lang="ts">
import Alert from '@packages/frontend-shared/src/components/Alert.vue'
import { watch } from 'vue'
import { gql, useMutation } from '@urql/vue'
import { TrackedBanner_RecordShownDocument, TrackedBanner_RecordDismissedDocument } from '../../generated/graphql'

type AlertComponentProps = InstanceType<typeof Alert>['$props']
type AlertComponentEmits = InstanceType<typeof Alert>['$emit']
interface TrackedBannerComponentProps extends AlertComponentProps {
  bannerId: string
  modelValue: boolean
}
interface TrackedBannerComponentEmits extends AlertComponentEmits {
  (e: 'update:modelValue'): void
}

gql`
mutation TrackedBanner_RecordShown($bannerId: String!) {
  setBannerShown(bannerId: $bannerId)
}
`

gql`
mutation TrackedBanner_RecordDismissed($bannerId: String!) {
  setBannerDismissed(bannerId: $bannerId)
}
`

const props = withDefaults(defineProps<TrackedBannerComponentProps>(), {})

const emit = defineEmits<TrackedBannerComponentEmits>()

const recordShownMutation = useMutation(TrackedBanner_RecordShownDocument)
const recordDismissedMutation = useMutation(TrackedBanner_RecordDismissedDocument)

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      const { bannerId } = props

      recordShownMutation.executeMutation({ bannerId })
    }
  },
  { immediate: true },
)

function handleBannerDismissed (visible: boolean) {
  const { bannerId } = props

  if (!visible) {
    recordDismissedMutation.executeMutation({ bannerId })
  }

  emit('update:modelValue', visible)
}

</script>
