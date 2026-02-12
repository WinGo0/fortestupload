<template>
  <div class="demo-container">
    <h2>Underscore (_) Character & Ellipsis Demo</h2>
    
    <div class="case-block">
      <h3>1. The Problem</h3>
      <p class="desc">
        The underscore character (<code>_</code>) sits low. If <code>line-height</code> is too small (e.g. 1 or less) or the container height is strictly limited, <code>overflow: hidden</code> might clip the bottom of the letters/underscores.
      </p>
      <div class="box problem">
        <span class="text">user_role_permission_settings_configuration_json_file_v2</span>
      </div>
    </div>

    <div class="case-block">
      <h3>2. Solution A: Increase Line Height</h3>
      <p class="desc">
        Setting <code>line-height</code> to at least 1.2 or 1.5 usually ensures there is enough vertical space for descenders (like g, p, y, _) to be visible.
      </p>
      <div class="box solution-a">
         <span class="text">user_role_permission_settings_configuration_json_file_v2</span>
      </div>
    </div>

    <div class="case-block">
      <h3>3. Solution B: Add Padding Bottom</h3>
      <p class="desc">
        If you cannot change line-height (e.g., strict design constraint), adding <code>padding-bottom: 2px</code> adds space inside the box before the overflow clip happens.
      </p>
      <div class="box solution-b">
         <span class="text">user_role_permission_settings_configuration_json_file_v2</span>
      </div>
    </div>
    
     <div class="case-block">
      <h3>4. Solution C: Height Adjustment</h3>
      <p class="desc">
        Sometimes a specific <code>height</code> is set that is just 1-2px too short for the font's rendering. Increasing it slightly helps.
      </p>
      <div class="box solution-c">
         <span class="text">user_role_permission_settings_configuration_json_file_v2</span>
      </div>
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

h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.case-block {
  margin-bottom: 30px;
  border: 1px dashed #555;
  padding: 15px;
}

.desc {
  font-size: 14px;
  color: #aaa;
  margin-bottom: 10px;
}

.box {
  width: 200px;
  background: #444;
  border: 1px solid #666;
  font-size: 16px;
  color: #fff;
  
  /* Shared Base Styles */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text {
  /* Using a font that has distinctive underscores if possible, but system fonts work */
}

/* 1. The Problem: Tight line height or fixed height cutting content */
.problem {
  /* Creating the issue artificially if normal doesn't show it. 
     Often happens with line-height: 1 or strict height */
  line-height: 1; 
  height: 16px; /* 16px font-size with 16px height touches the edges */
  
  /* If the underscore is low, it might be cut off by the border/overflow */
  display: block; 
}

/* 2. Solution A: Proper line-height */
.solution-a {
  line-height: 1.5; /* ample space */
  height: auto;     /* or sufficient fixed height */
}

/* 3. Solution B: Padding */
.solution-b {
  line-height: 1; 
  height: auto;
  padding-bottom: 4px; /* Room for descenders */
}

/* 4. Solution C: Height */
.solution-c {
  line-height: 1.2;
  height: 22px; /* Sufficient height calculation (16 * 1.2 + buffer) */
  display: flex;
  align-items: center; /* vertical alignment often helps too */
}
</style>
