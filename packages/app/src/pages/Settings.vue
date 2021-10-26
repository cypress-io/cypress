<template>
  <div>
    <h2>Settings Page</h2>
    <Button @click="reconfigure">
      Reconfigure
    </Button>
  </div>
</template>

<script>
import { Button } from '@packages/frontend-shared'
import { gql, useMutation } from '@urql/vue'
import { Settings_OpenLaunchpadDocument } from '../generated/graphql'

gql`
mutation Settings_OpenLaunchpad {
  showBrowserWindow
}
`

const openLaunchpad = useMutation(Settings_OpenLaunchpadDocument)

function reconfigure () {
  openLaunchpad.executeMutation()
}

</script>

<route>
{
  name: "Settings Page"
}
</route>
