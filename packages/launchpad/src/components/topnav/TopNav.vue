<template>
    <TopNavList v-if="versionList">
        <template #heading>{{ versionList[0].version }}</template>
        <TopNavListItem v-for="(item, index) in versionList" :key="item.version">
            <div>
                <a :href="`${releasesUrl}/tag/v${item.version}`" target="_blank">{{ item.version }}</a>
                <br />
                {{ item.released }}
            </div>
            <template v-if="!index" #suffix>check</template>
        </TopNavListItem>
        <TopNavListItem class="text-center p-4">
            <a :href="releasesUrl">See all releases</a>
        </TopNavListItem>
    </TopNavList>

    <TopNavList v-if="browsers">
        <template #heading>browser</template>
        <TopNavListItem v-for="browser in browsers">
            <template #prepend>hey</template>
            <span>{{ browser.displayName }}</span>
            <template #append>append</template>
        </TopNavListItem>
    </TopNavList>

    <TopNavList variant="panel">
        <template #heading>I have no UL</template>
        <div>
            Columns right here
        </div>
    </TopNavList>
</template>

<script setup lang="ts">

import { useMutation, gql, useQuery } from "@urql/vue";

import TopNavListItem from './TopNavListItem.vue'
import TopNavList from "./TopNavList.vue"

import { TopNavDocument } from "../../generated/graphql"
import { computed } from 'vue'


gql`
query TopNav {
  app {
    ...OpenBrowserList
  }
}
`

const query = useQuery({ query: TopNavDocument })
const browsers = computed(() => query?.data?.value?.app?.browsers)

// will come from gql
const versionList = [
    {
        version: '8.4.1',
        released: '2 days ago',
    },
    {
        version: '8.4.1',
        released: '2 days ago',
    },
    {
        version: '8.4.1',
        released: '2 days ago',
    }
]

const releasesUrl = "https://github.com/cypress-io/cypress/releases/"

</script>