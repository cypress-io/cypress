<template>
  <div
    class="h-full outline-none border-gray-50 ring-inset grid grid-cols-2 group focus-within:ring-indigo-300 focus-within:ring-1 children:cursor-pointer"
    data-cy="specs-list-row"
  >
    <div>
      <slot name="file" />
    </div>

    <div>
      <slot name="git-info" />
    </div>
  </div>
</template>
