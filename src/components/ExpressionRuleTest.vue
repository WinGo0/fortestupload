<template>
  <main class="expression-rule-test">
    <RuleBuilderNew />
  </main>
</template>

<script setup>
import RuleBuilderNew from './expression-liantiao/RuleBuilderNew.vue'
</script>

<style scoped>
.expression-rule-test {
  box-sizing: border-box;
  width: min(1200px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: 20px;
  color: #303133;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
  color-scheme: light;
}
</style>
