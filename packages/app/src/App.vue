<template>
  <router-view v-slot="{ Component }">
    <component
      :is="Component"
    />
  </router-view>
</template>

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
