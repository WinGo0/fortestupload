<template>
  <main class="expression-rule-test">
    <h2>表达式规则组件测试</h2>
    <RuleBuilder :initial-data="initialData" />
    <!-- <RuleBuilderNew /> -->
  </main>
</template>

<script setup>
import RuleBuilder from './expression-liantiao/RuleBuilder.vue'
import RuleBuilderNew from './expression-liantiao/RuleBuilderNew.vue'

const initialData = {
  "nodeType": "LOGIC_NODE",
  "logicOperator": "AND",
  "children": [
    {
      "nodeType": "CONDITION_NODE",
      "type": "REAL_TIME",
      "paramCode": "temperature",
      "operator": "GT",
      "threshold": 30,
      "timeValue": 1,
      "timeUnit": "SECOND",
      "targetState": 1,
      "openRangeStart": null,
      "openRangeEnd": null,
      "closeRangeStart": null,
      "closeRangeEnd": null
    },
    {
      "nodeType": "CONDITION_NODE",
      "type": "REAL_TIME",
      "paramCode": "dsaf",
      "operator": "EQ",
      "threshold": 323,
      "timeValue": 1,
      "timeUnit": "SECOND",
      "targetState": 1,
      "openRangeStart": null,
      "openRangeEnd": null,
      "closeRangeStart": null,
      "closeRangeEnd": null
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
