<template>
  <section class="base-drawer">
    <header v-if="$slots.header" class="base-drawer__header">
      <slot name="header" />
    </header>

    <div class="base-drawer__content">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="base-drawer__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.base-drawer {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background: #fff;
}

.base-drawer__header {
  border-bottom: 1px solid #ebeef5;
}

.base-drawer__content {
  flex: 1;
}

.base-drawer__footer {
  border-top: 1px solid #ebeef5;
}
</style>
