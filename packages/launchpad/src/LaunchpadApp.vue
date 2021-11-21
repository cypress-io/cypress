<template>
  <div
    v-if="backendInitialized"
    class="h-full mx-auto bg-white"
  >
    <LaunchpadMain />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { gql, useMutation, useQuery } from '@urql/vue'
import LaunchpadMain from './LaunchpadMain.vue'
import { LaunchpadAppQueryDocument, App_DevRelaunchDocument } from './generated/graphql'

gql`
query LaunchpadAppQuery {
  __typename
  dev {
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

/**
 * TODO: Tim - see if this is still possible, this should never happen
 *
 * Sometimes the electron app can start before the GraphQL
 * server and current project has been initialized.
 * We poll until those conditions are met, then render the app
 */
const query = useQuery({
  query: LaunchpadAppQueryDocument,
  requestPolicy: 'cache-and-network',
})

let interval: number
const poll = () => {
  try {
    if (backendInitialized.value) {
      window.clearInterval(interval)
    } else {
      query.executeQuery()
    }
  } catch (e) {
    // probably graphql server has not initialized yet
  }
}

let isShowingRelaunch = ref(false)

const toast = useToast()

watch(query.data, () => {
  if (process.env.NODE_ENV !== 'production') {
    if (query.data.value?.dev.needsRelaunch && !isShowingRelaunch.value) {
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
  }
})

interval = window.setInterval(poll, 200)

const backendInitialized = computed(() => !!query.data?.value?.__typename)

</script>

<style lang="scss">
html,
body,
#app {
  @apply h-full bg-white;
}

@font-face {
  font-family: "Fira Code";
  src: local("Fira Code"),
   url('../../frontend-shared/src/assets/fonts/FiraCode-VariableFont_wght.ttf') format("truetype");
}
</style>
