<template>
  <div class="h-screen overflow-hidden flex flex-row bg-red">
    <main class="min-w-0 flex-1 border-t bg-green border-gray-200 lg:flex">
      <section
        aria-labelledby="primary-heading"
        class="min-w-0 flex-1 h-full flex flex-col overflow-hidden lg:order-last"
      >
        <router-view v-slot="{ Component, route }">
          <h1
            id="primary-heading"
            class="sr-only"
          >
            {{ route.name }}
          </h1>
          <transition
            name="fade"
            mode="out-in"
          >
            <keep-alive>
              <component
                :is="Component"
              />
            </keep-alive>
          </transition>
        </router-view>
      </section>
    </main>
    <nav class="h-screen order-first w-240px">
      <SidebarNavigation class="h-full" />
    </nav>
  </div>
</template>

<script lang="ts" setup>
import SidebarNavigation from '../navigation/SidebarNavigation.vue'
</script>
