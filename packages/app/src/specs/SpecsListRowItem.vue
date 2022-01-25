<template>
  <div
    class="grid grid-cols-2 outline-none children:cursor-pointer group h-full"
    data-cy="specs-list-row"
    tabindex="0"
  >
    <div>
      <slot name="file" />
    </div>

    <div>
      <slot name="git-info" />
    </div>
  </div>
</template>
