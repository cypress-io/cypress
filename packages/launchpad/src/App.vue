<template>
  <div
    class="h-full mx-auto bg-white"
  >
    <Main />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import { gql, useMutation, useSubscription } from '@urql/vue'
import Main from './Main.vue'
import { App_NeedsRelaunchDocument, App_DevRelaunchDocument } from './generated/graphql'

gql`
subscription App_NeedsRelaunch {
  devChange {
    needsRelaunch
  }
}
`

gql`
mutation App_DevRelaunch($action: DevRelaunchAction!) {
  devRelaunch(action: $action)
}
`

const relaunchMutation = useMutation(App_DevRelaunchDocument)

let isShowingRelaunch = ref(false)

const toast = useToast()

if (process.env.NODE_ENV !== 'production') {
  useSubscription({ query: App_NeedsRelaunchDocument }, (_, next) => {
    if (next.devChange?.needsRelaunch && !isShowingRelaunch.value) {
      isShowingRelaunch.value = true
      toast.info('Server updated, click to relaunch', {
        timeout: false,
        onClick: () => {
          relaunchMutation.executeMutation({ action: 'trigger' })
        },
        onClose: () => {
          isShowingRelaunch.value = false
          relaunchMutation.executeMutation({ action: 'dismiss' })
        },
      })
    }

    return next
  })
}
</script>
