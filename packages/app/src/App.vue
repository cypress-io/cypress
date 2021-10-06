<template>
  <router-view v-slot="{ Component }">
    <!-- TODO(lachlan): put this back after doing proper cleanup when unmounting the runner page -->
    <!-- <keep-alive> -->
    <component :is="Component" />
    <!-- </keep-alive> -->
  </router-view>
</template>
