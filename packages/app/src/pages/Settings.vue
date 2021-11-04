<template>
<<<<<<< HEAD
  <SettingsContainer
    v-if="query.data.value"
    :gql="query.data.value"
  />
</template>

<script lang="ts" setup>
import { gql, useQuery } from '@urql/vue'
import { SettingsDocument } from '../generated/graphql'
import SettingsContainer from '../settings/SettingsContainer.vue'

gql`
query Settings {
  ...SettingsContainer
}`

const query = useQuery({ query: SettingsDocument })
=======
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

const openElectron = useMutation(Settings_ReconfigureProjectDocument)

function reconfigure () {
  openElectron.executeMutation({})
}

>>>>>>> origin/unified-desktop-gui
</script>

<route>
{
  name: "Settings Page",
  meta: {
    title: "Settings"
  }
}
</route>
