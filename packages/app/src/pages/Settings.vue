<template>
  <div>
    <Button @click="reconfigure">
      Reconfigure
    </Button>
    <SettingsContainer
      v-if="query.data.value"
      :gql="query.data.value"
    />
  </div>
</template>

<script lang="ts" setup>
import { gql, useQuery, useMutation } from '@urql/vue'
import Button from '@cy/components/Button.vue'
import SettingsContainer from '../settings/SettingsContainer.vue'
import { Settings_ReconfigureProjectDocument, SettingsDocument } from '../generated/graphql'

gql`
query Settings {
  ...SettingsContainer
}`

gql`
mutation Settings_ReconfigureProject {
  reconfigureProject
}
`

const query = useQuery({ query: SettingsDocument })

const openElectron = useMutation(Settings_ReconfigureProjectDocument)

function reconfigure () {
  openElectron.executeMutation({})
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
