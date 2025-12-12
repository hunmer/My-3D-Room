<template>
  <div class="room3d-container" ref="containerRef">
    <!-- 加载进度 -->
    <div v-if="isLoading" class="loading-screen">
      <div class="loading-bar">
        <div class="loading-progress" :style="{ width: loadingProgress + '%' }"></div>
      </div>
      <div class="loading-text">{{ Math.round(loadingProgress) }}%</div>
    </div>

    <!-- 3D 组件（资源加载完成后渲染） -->
    <template v-if="!isLoading && scene">
      <!-- 主房间模型 -->
      <Baked
        ref="bakedRef"
        :scene="scene"
        :night-mix="nightMix"
        :neutral-mix="neutralMix"
        :tv-color="tvColor"
        :tv-strength="tvStrength"
        :desk-color="deskColor"
        :desk-strength="deskStrength"
        :pc-color="pcColor"
        :pc-strength="pcStrength"
      />

      <!-- Google LEDs -->
      <GoogleLeds :scene="scene" />

      <!-- 咖啡蒸汽 -->
      <CoffeeSteam :scene="scene" />

      <!-- 椅子（使用共享的 baked 材质） -->
      <TopChair
        :scene="scene"
        :baked-material="bakedMaterial"
      />

      <!-- 电脑屏幕 -->
      <Screen :scene="scene" />

      <!-- Elgato 灯光 -->
      <ElgatoLight
        :scene="scene"
        :color="elgatoLightColor"
        :intensity="elgatoLightIntensity"
      />

      <!-- Loupedeck 按钮 -->
      <LoupedeckButtons :scene="scene" />

      <!-- 猫模型 -->
      <Cat
        ref="catRef"
        :scene="scene"
        :position="catPosition"
        :target-size="catTargetSize"
        :rotation="catRotation"
        @click="handleCatClick"
      />
    </template>

    <!-- TransformControls 控制面板 -->
    <div v-if="isTransformActive" class="transform-controls-panel">
      <div class="transform-header">
        <span class="transform-title">变换工具</span>
        <button class="transform-close" @click="closeTransformControls" title="关闭">×</button>
      </div>
      <div class="transform-modes">
        <button
          :class="['mode-btn', { active: transformMode === 'translate' }]"
          @click="setTransformMode('translate')"
          title="移动 (G)"
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M12 2L8 6h3v6H5V9l-4 4 4 4v-3h6v6H8l4 4 4-4h-3v-6h6v3l4-4-4-4v3h-6V6h3z"/>
          </svg>
        </button>
        <button
          :class="['mode-btn', { active: transformMode === 'rotate' }]"
          @click="setTransformMode('rotate')"
          title="旋转 (R)"
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
          </svg>
        </button>
        <button
          :class="['mode-btn', { active: transformMode === 'scale' }]"
          @click="setTransformMode('scale')"
          title="缩放 (S)"
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M21 15h2v2h-2v-2zm0-4h2v2h-2v-2zm2 8h-2v2c1 0 2-1 2-2zM13 3h2v2h-2V3zm8 4h2v2h-2V7zm0-4v2h2c0-1-1-2-2-2zM1 7h2v2H1V7zm16-4h2v2h-2V3zm0 16h2v2h-2v-2zM3 3C2 3 1 4 1 5h2V3zm6 0h2v2H9V3zM5 3h2v2H5V3zm-4 8v8c0 1.1.9 2 2 2h12v-2H3v-8H1z"/>
          </svg>
        </button>
      </div>
      <div class="transform-space">
        <button
          :class="['space-btn', { active: transformSpace === 'world' }]"
          @click="toggleTransformSpace"
          :title="transformSpace === 'world' ? '世界坐标' : '本地坐标'"
        >
          {{ transformSpace === 'world' ? '世界' : '本地' }}
        </button>
      </div>
      <div class="transform-hint">
        <span>点击模型切换 · ESC 关闭</span>
      </div>
    </div>

    <!-- GUI 调试面板 -->
    <DebugGUI
      v-if="debugEnabled && !isLoading"
      v-model:night-mix="nightMix"
      v-model:neutral-mix="neutralMix"
      v-model:tv-color="tvColor"
      v-model:tv-strength="tvStrength"
      v-model:desk-color="deskColor"
      v-model:desk-strength="deskStrength"
      v-model:pc-color="pcColor"
      v-model:pc-strength="pcStrength"
      v-model:cat-position-x="catPositionX"
      v-model:cat-position-y="catPositionY"
      v-model:cat-position-z="catPositionZ"
      v-model:cat-target-size="catTargetSize"
      v-model:cat-rotation-y="catRotationY"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { useExperience } from '@/composables/useExperience'
import type { TransformMode, TransformSpace } from '@/composables/useTransformControls'
import Baked from './Baked.vue'
import GoogleLeds from './GoogleLeds.vue'
import CoffeeSteam from './CoffeeSteam.vue'
import TopChair from './TopChair.vue'
import Screen from './Screen.vue'
import ElgatoLight from './ElgatoLight.vue'
import LoupedeckButtons from './LoupedeckButtons.vue'
import Cat from './Cat.vue'
// ModelEditor 组件保留但暂不使用，改用 TransformControls
// import ModelEditor from './ModelEditor.vue'
import DebugGUI from './DebugGUI.vue'

// Refs
const containerRef = ref<HTMLElement | null>(null)
const bakedRef = ref<InstanceType<typeof Baked> | null>(null)
const catRef = ref<InstanceType<typeof Cat> | null>(null)

// Experience
const {
  scene,
  config,
  isLoading,
  loadingProgress,
  setContainer,
  loadResources,
  start,
  stop,
  destroy,
  transformControls
} = useExperience()

// 调试模式
const debugEnabled = ref(window.innerWidth > 420)

// 环境光参数
const nightMix = ref(0)
const neutralMix = ref(0)

// 电视灯光参数
const tvColor = ref('#ff115e')
const tvStrength = ref(1.47)

// 桌面灯光参数
const deskColor = ref('#ff6700')
const deskStrength = ref(1.9)

// PC 灯光参数
const pcColor = ref('#0082ff')
const pcStrength = ref(1.4)

// Elgato 灯光参数（保留旧参数以兼容 ElgatoLight 组件）
const elgatoLightColor = ref('#ffeedd')
const elgatoLightIntensity = ref(1)

// 猫模型参数
// 房间约 10x10 单位，猫 FBX 原始约 60 单位（厘米）
// 目标尺寸 0.15 = 小摆件（约 15cm），0.5 = 真猫大小（约 50cm）
const catPosition = ref({ x: -1.5, y: 0, z: 1 })
const catTargetSize = ref(0.15) // 小摆件尺寸
const catRotation = ref({ x: 0, y: Math.PI / 4, z: 0 })

// TransformControls 状态
const isTransformActive = transformControls.isVisible
const transformMode = transformControls.currentMode
const transformSpace = transformControls.currentSpace

// 点击猫模型处理 - 使用 TransformControls
const handleCatClick = () => {
  const catModel = catRef.value?.catModel
  if (catModel) {
    // 切换 TransformControls 附加状态
    transformControls.toggle(catModel, {
      mode: 'translate',
      space: 'world',
      size: 0.8
    })
  }
}

// 关闭 TransformControls
const closeTransformControls = () => {
  transformControls.detach()
}

// 切换变换模式
const setTransformMode = (mode: TransformMode) => {
  transformControls.setMode(mode)
}

// 切换坐标空间
const toggleTransformSpace = () => {
  transformControls.toggleSpace()
}

// 猫模型位置和旋转的独立属性（用于 DebugGUI 绑定）
const catPositionX = computed({
  get: () => catPosition.value.x,
  set: (v) => { catPosition.value = { ...catPosition.value, x: v } }
})
const catPositionY = computed({
  get: () => catPosition.value.y,
  set: (v) => { catPosition.value = { ...catPosition.value, y: v } }
})
const catPositionZ = computed({
  get: () => catPosition.value.z,
  set: (v) => { catPosition.value = { ...catPosition.value, z: v } }
})
const catRotationY = computed({
  get: () => (catRotation.value.y * 180) / Math.PI, // 弧度转角度
  set: (v) => { catRotation.value = { ...catRotation.value, y: (v * Math.PI) / 180 } } // 角度转弧度
})

// 从 Baked 组件获取共享材质
const bakedMaterial = computed<THREE.ShaderMaterial | null>(() => {
  return bakedRef.value?.bakedMaterial ?? null
})

// TransformControls 变换同步 - 将 3D 变换同步回 Vue 状态
const unregisterTransformChange = ref<(() => void) | null>(null)

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  // ESC 关闭 TransformControls
  if (event.key === 'Escape' && isTransformActive.value) {
    closeTransformControls()
    return
  }

  // 快捷键切换模式（仅当 TransformControls 激活时）
  if (isTransformActive.value) {
    switch (event.key.toLowerCase()) {
      case 'g':
        setTransformMode('translate')
        break
      case 'r':
        setTransformMode('rotate')
        break
      case 's':
        setTransformMode('scale')
        break
    }
  }
}

// 生命周期
onMounted(async () => {
  if (containerRef.value) {
    // 初始化 Three.js
    setContainer(containerRef.value)

    // 开始渲染循环
    start()

    // 加载资源
    await loadResources()

    // 注册变换改变回调 - 同步 catModel 的变换到 Vue 响应式状态
    unregisterTransformChange.value = transformControls.onTransformChange((object) => {
      // 同步位置
      catPosition.value = {
        x: object.position.x,
        y: object.position.y,
        z: object.position.z
      }
      // 同步旋转
      catRotation.value = {
        x: object.rotation.x,
        y: object.rotation.y,
        z: object.rotation.z
      }
      // 注：targetSize 不在此处同步，因为它通过 scale 计算得出
      // 如需同步 scale，需要额外处理 targetSize = scale * originalMaxDimension
    })

    // 添加键盘事件监听
    window.addEventListener('keydown', handleKeyDown)
  }
})

// 清理
onUnmounted(() => {
  // 移除键盘事件监听
  window.removeEventListener('keydown', handleKeyDown)

  // 取消注册变换回调
  if (unregisterTransformChange.value) {
    unregisterTransformChange.value()
  }
  stop()
  destroy()
})
</script>

<style scoped>
.room3d-container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #010101;
}

/* 加载屏幕 */
.loading-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #010101;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-bar {
  width: 300px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 10px;
}

.loading-progress {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff, #0099ff);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.loading-text {
  color: white;
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  letter-spacing: 2px;
}

/* 响应式 */
@media (max-width: 768px) {
  .loading-bar {
    width: 200px;
  }
}

/* TransformControls 控制面板 */
.transform-controls-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(20, 20, 25, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  min-width: 140px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  z-index: 100;
  user-select: none;
}

.transform-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.transform-title {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.transform-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.2s;
}

.transform-close:hover {
  color: #ff6b6b;
}

.transform-modes {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.mode-btn.active {
  background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 2px 10px rgba(0, 153, 255, 0.3);
}

.transform-space {
  margin-bottom: 8px;
}

.space-btn {
  width: 100%;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.space-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.space-btn.active {
  background: rgba(0, 212, 255, 0.15);
  border-color: rgba(0, 212, 255, 0.3);
  color: #00d4ff;
}

.transform-hint {
  text-align: center;
  color: rgba(255, 255, 255, 0.35);
  font-size: 10px;
  margin-top: 4px;
}
</style>
