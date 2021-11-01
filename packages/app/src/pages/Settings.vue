<template>
  <div>
    <h2>Settings Page</h2>
    <Button @click="reconfigure">
      Reconfigure
    </Button>
  </div>
</template>

<script lang="ts" setup>
import Button from '@cy/components/Button.vue'
import { gql, useMutation } from '@urql/vue'
import { Settings_ReconfigureProjectDocument } from '../generated/graphql'

gql`
mutation Settings_ReconfigureProject {
  reconfigureProject
}
`

const openLaunchpad = useMutation(Settings_ReconfigureProjectDocument)

function reconfigure () {
  openLaunchpad.executeMutation({})
}

</script>

<route>
{
  name: "Settings Page",
  meta: {
    title: "Settings"
  }
}
</route>
