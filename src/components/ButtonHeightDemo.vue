<template>
  <div class="demo-container">
    <h2>Button Height Customization Demo</h2>
    
    <div class="case-block">
      <h3>Normal Buttons</h3>
      <el-button>Default Height</el-button>
      <el-button type="primary">Primary Button</el-button>
    </div>

    <div class="case-block selected-params">
      <h3>Buttons inside .selected-params</h3>
      <p class="desc">
        These buttons utilize the <code>.selected-params :deep(.el-button)</code> selector to override the height.
      </p>
      <el-button>Custom Height</el-button>
      <el-button type="primary">Primary Custom</el-button>
      <el-button type="success">Success Custom</el-button>
    </div>
  </div>
</template>

<style scoped>
.demo-container {
  padding: 20px;
  background: #333;
  color: #fff;
  border-radius: 8px;
}

.case-block {
  margin-bottom: 20px;
  border: 1px dashed #555;
  padding: 15px;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.desc {
  font-size: 14px;
  color: #aaa;
  margin-bottom: 10px;
}

/* 
  Correct way to target inner el-button styles when using scoped CSS 
*/
.selected-params :deep(.el-button) {
  height: 50px;       /* Custom Height */
  line-height: 50px;  /* Often needed for text vertical alignment if not using flex */
  font-size: 18px;    /* Optional: larger font */
  padding: 0 30px;    /* Optional: wider padding */
}
</style>
