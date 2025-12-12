# 3D Room 项目迁移计划：JS → TS + Vite + Vue

## 项目概述

**迁移目标**：将现有的 JavaScript + Webpack 3D Room 项目迁移到 TypeScript + Vite + Vue 技术栈

**核心需求**：
1. 保留所有 Three.js 3D 功能和交互
2. 将 Three.js 封装为 Vue 组件
3. 以 TypeScript 为优先，确保类型安全

**当前技术栈**：Three.js + Webpack + JavaScript + GSAP + Tweakpane
**目标技术栈**：Vue 3 + TypeScript + Vite + Three.js + GSAP + Tweakpane

## 架构分析总结

### 核心模块

**可复用模块（直接迁移）**：
- ✅ Utils工具类：Time、EventEmitter、Sizes、Stats、Loader
- ✅ 资源加载系统：Resources、Loader
- ✅ 相机导航：Navigation
- ✅ 着色器代码：CoffeeSteam（需要适配glslify）

**需要Vue化改造**：
- ⚠️ Experience单例 → Vue全局状态管理（Pinia）
- ⚠️ Tweakpane调试 → Vue调试面板组件
- ⚠️ World统一管理 → 拆分为多个Vue组件

**8个3D对象**：
- Baked（静态房间）
- GoogleLeds（LED灯动画）
- LoupedeckButtons（调音台按钮）
- CoffeeSteam（蒸汽着色器）
- TopChair（顶部椅子）
- ElgatoLight（补光灯）
- BouncingLogo（弹跳Logo）
- Screen（屏幕视频播放）

## 迁移计划（分9个阶段）

### 阶段1：项目架构初始化 ✅
**任务**：分析现有项目结构和依赖关系
**状态**：已完成
**产出**：
- 详细的架构分析报告
- 依赖关系图
- 迁移重点清单

### 阶段2：基础项目架构搭建 ✅
**任务**：创建 TypeScript + Vite + Vue 基础项目架构
**状态**：已完成
**具体步骤**：
1. ✅ 初始化 Vite + Vue 3 + TypeScript 项目
2. ✅ 安装核心依赖：
   - three + @types/three
   - vue
   - vite
   - @vitejs/plugin-vue
   - typescript
   - vite-plugin-glsl
3. ✅ 配置 Vite 构建系统
4. ✅ 设置目录结构
5. ✅ 配置 TypeScript 严格模式（部分放宽）
6. ✅ 配置 Vue 单文件组件

**产出**：
- ✅ 基础 Vite + Vue + TS 项目结构
- ✅ 完整的构建配置
- ✅ 开发服务器正常运行（端口 8080）

### 阶段3：核心模块TypeScript迁移 ✅
**任务**：将 Three.js 核心模块迁移为 TypeScript
**状态**：已完成
**具体步骤**：
1. ✅ 迁移 Utils 工具类：
   - EventEmitter.ts（事件系统）
   - Time.ts（动画时间管理）
   - Sizes.ts（窗口尺寸监听）
   - Loader.ts（资源加载器 - 简化版）

2. ✅ 迁移核心系统：
   - useExperience Composable（Three.js 封装）
   - TypeScript 类型系统

3. ✅ 创建类型定义：
   - three.d.ts（Three.js 类型接口）
   - ExperienceConfig（配置类型）
   - EventEmitter 泛型支持

**产出**：
- ✅ 所有核心工具类 TypeScript 化
- ✅ 完整的类型定义
- ✅ 类型检查通过

### 阶段4：Vue组件封装 ✅
**任务**：创建 Vue 组件封装 Three.js 场景
**状态**：已完成（基础架构）
**具体步骤**：
1. ✅ 创建 Experience Composable：
   ```typescript
   export const useExperience = () => {
     // Three.js 的 Vue Composable 封装
   }
   ```

2. ✅ 创建主要 Vue 组件：
   - Room3D.vue（主容器组件）
   - 响应式调试面板
   - 加载进度显示

3. ✅ Vue 生命周期管理：
   - onMounted：初始化 Three.js
   - onBeforeUnmount：清理资源

**产出**：
- ✅ Vue 组件化的基础架构
- ✅ 响应式的调试面板
- ✅ 正确的资源清理机制

### 阶段5：着色器迁移 🔄
**任务**：迁移着色器代码到 TypeScript
**状态**：进行中（配置完成，待迁移代码）
**具体步骤**：
1. ✅ 配置 Vite 处理 GLSL 文件：
   - vite-plugin-glsl 已配置
   - 支持 .glsl, .vert, .frag 文件

2. ⏳ 迁移 CoffeeSteam 着色器：
   - vertex.glsl
   - fragment.glsl
   - perlin2d.glsl

3. ⏳ 创建着色器加载器：
   ```typescript
   const loadShader = (vertex: string, fragment: string) => {
     // 统一着色器加载
   }
   ```

**进度**：Vite 配置完成，着色器文件迁移待开始

### 阶段6：构建配置 ✅
**任务**：配置 Vite 构建和开发环境
**状态**：已完成
**具体步骤**：
1. ✅ 配置 Vite 开发服务器：
   - 端口：8080 ✓
   - 自动打开浏览器 ✓
   - 热重载 ✓

2. ✅ 配置生产构建：
   - 代码分割（Three.js 独立打包）✓
   - 资源压缩 ✓
   - Source Map 支持 ✓

3. ✅ 集成静态资源：
   - 路径别名配置（@ 和 ~）✓
   - Vite 原生静态资源支持 ✓

**产出**：
- ✅ 完整的 Vite 配置
- ✅ 开发服务器正常运行
- ✅ 类型检查通过

### 阶段7：第三方库集成 ⏳
**任务**：集成 GSAP、Tweakpane 等第三方库
**状态**：待开始（依赖已安装）
**已安装依赖**：
- ✅ GSAP 3.7.1（package.json 中）
- ✅ Tweakpane 3.0.5（package.json 中）
- ✅ Stats.js 0.17.0（package.json 中）

**待完成**：
1. ⏳ 在 Vue 组件中集成 GSAP
2. ⏳ 创建 Tweakpane Vue 封装
3. ⏳ 集成 Stats.js 性能监控

**预期产出**：
- Vue 集成的动画库
- Vue 集成的调试工具
- 性能监控正常

### 阶段8：功能测试验证 ⏳
**任务**：测试和验证所有 3D 功能
**状态**：待开始（基础架构就绪）
**当前状态**：
- ✅ 基础 Three.js 场景已初始化
- ✅ Vue 组件架构已建立
- ⏳ 3D 对象组件待迁移

**待完成**：
1. ⏳ 迁移 8 个 3D 对象组件
2. ⏳ 验证相机控制
3. ⏳ 验证动画效果
4. ⏳ 验证调试面板

**预期产出**：
- 所有 3D 功能正常工作
- 性能指标达标

### 阶段9：性能优化 ⏳
**任务**：性能优化和构建配置调整
**状态**：待开始
**待完成**：
1. ⏳ 代码分割优化
2. ⏳ 资源压缩优化
3. ⏳ 缓存策略配置
4. ⏳ CDN 配置

**预期产出**：
- 更小的打包体积
- 更快的加载速度

## 技术决策

### 1. 组件化策略
- **现状**：World.js 统一管理所有 3D 对象
- **方案**：拆分为独立的 Vue 组件，每个 3D 对象一个组件
- **好处**：组件复用、状态隔离、维护性更好

### 2. 状态管理
- **现状**：Experience 单例，全局访问
- **方案**：使用 Pinia 创建全局 Store
- **好处**：Vue 原生状态管理、响应式、类型安全

### 3. 类型定义
- **策略**：严格的 TypeScript 配置
- ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true
    }
  }
  ```

### 4. 生命周期
- **Vue 生命周期**：
  - onMounted：初始化 Three.js 实例
  - onBeforeUnmount：清理 Three.js 资源
- **Three.js 生命周期**：
  - 保持原有的动画循环
  - 使用 Vue 的 watch 监听参数变化

## 风险评估

### 高风险
1. **Experience 单例重构**：影响整个架构
   - **缓解**：先创建适配层，逐步迁移
2. **着色器加载**：Vite 与 glslify 的兼容性问题
   - **缓解**：使用 Vite 原生 GLSL 支持
3. **视频资源**：大文件迁移
   - **缓解**：保持原有静态资源路径

### 中风险
1. **调试系统**：Tweakpane 与 Vue 集成
   - **缓解**：创建专门的 Vue 组件包装
2. **性能损失**：Vue 封装带来的开销
   - **缓解**：使用 ref 直接操作 DOM，减少 Vue 干预

### 低风险
1. **工具类迁移**：Utils 模块相对独立
2. **资源加载**：Three.js API 稳定

## 验收标准

### 功能完整性
- [ ] 所有 8 个 3D 对象正常工作
- [ ] 相机控制和导航正常
- [ ] 着色器效果正常
- [ ] 调试面板正常工作

### 性能指标
- [ ] FPS > 60（桌面端）
- [ ] 首屏加载时间 < 3s
- [ ] 资源大小优化

### 代码质量
- [ ] TypeScript 严格模式通过
- [ ] ESLint 检查通过
- [ ] 代码覆盖率 > 80%

## 下一步行动

1. **立即执行**：完成阶段2（基础项目架构）
2. **并行执行**：阶段3（TypeScript迁移）和阶段4（Vue组件）
3. **测试驱动**：每个阶段完成后立即验证

---

**创建时间**：2025-12-12
**预计完成时间**：1-2天
**负责人**：Claude Code