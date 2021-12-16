<template>
  <BaseError
    v-if="query.data.value?.baseError"
    :gql="query.data.value.baseError"
  />
  <div v-else-if="!backendInitialized">
    Loading...
  </div>
  <div
    v-else
    class="bg-white h-full mx-auto"
  >
    <Main />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { gql, useMutation, useQuery } from '@urql/vue'
import BaseError from './error/BaseError.vue'
import Main from './Main.vue'
import { AppQueryDocument, App_DevRelaunchDocument } from './generated/graphql'

gql`
query AppQuery {
  __typename
  dev {
    needsRelaunch
  }
  baseError {
    __typename
  }
  ...BaseError
}
`

gql`
mutation App_DevRelaunch($action: DevRelaunchAction!) {
  devRelaunch(action: $action)
}
`

const relaunchMutation = useMutation(App_DevRelaunchDocument)

/**
 * Sometimes the electron app can start before the GraphQL
 * server and current project has been initialized.
 * We poll until those conditions are met, then render the app
 */
const query = useQuery({
  query: AppQueryDocument,
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
  @apply bg-white h-full;
}

@font-face {
  font-family: "Fira Code";
  src: local("Fira Code"),
   url('../../frontend-shared/src/assets/fonts/FiraCode-VariableFont_wght.ttf') format("truetype");
}
</style>
