<template>
  <div class="text-center mt-20 w-400px mx-auto p-20px border-1 rounded-md">
    <h1 class="text-2xl">
      You seem to have gotten lost...
    </h1>
    <p class="text-gray-600">
      Try one of these links instead
    </p>
    <nav class="space-y-2 mt-40px">
      <li
        v-for="route in routes"
        :key="route.path"
        class="text-left underline underline-2 underline-offset-1 underline-indigo-700 text-indigo-700 hover:text-indigo-500 hover:underline-indigo-500"
      >
        <router-link :to="route.path">
          {{ route.name }}
        </router-link>
      </li>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { uniqBy } from 'lodash'

const routes = computed(() => {
  return uniqBy(useRouter().getRoutes(), 'path').filter((r) => r.meta?.layout !== 'error' && !r.meta?.error)
})
</script>

<route>
{
  meta: {
    layout: "default",
    error: true
  },
  name: "404 Page"
}
</route>
