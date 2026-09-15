<template>
  <main class="expression-rule-test">
    <h2>表达式规则组件测试</h2>
    <RuleBuilder :initial-data="initialData" />
    <!-- <RuleBuilderNew /> -->
  </main>
</template>

<script setup>
import RuleBuilder from './expression-liantiao/RuleBuilder.vue'
// import RuleBuilderNew from './expression-liantiao/RuleBuilderNew.vue'

const initialData = {
  type: 'group',
  operator: 'AND',
  children: [
    {
      type: 'rule',
      value: {
        parameter: 'temperature',
        operator: '>',
        comparisonValue: 30
      }
    },
    {
      type: 'rule',
      value: {
        parameter: 'pressure',
        operator: '<',
        comparisonValue: 100
      }
    }
  ]
}
</script>

<style scoped>
.expression-rule-test {
  box-sizing: border-box;
  width: min(1200px, 100%);
  min-height: 100%;
  margin: 0 auto;
  padding: 24px;
}

h2 {
  margin: 0 0 16px;
  font-size: 20px;
}
</style>
