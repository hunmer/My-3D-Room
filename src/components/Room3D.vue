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
      <Baked :scene="scene" :sun-mode="sunMode" />

      <!-- Google LEDs -->
      <GoogleLeds :scene="scene" />

      <!-- 咖啡蒸汽 -->
      <CoffeeSteam :scene="scene" />

      <!-- 椅子 -->
      <TopChair :scene="scene" />

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
    </template>

    <!-- GUI 调试面板 -->
    <DebugGUI
      v-if="debugEnabled && !isLoading"
      v-model:sun-mode="sunMode"
      v-model:elgato-light-color="elgatoLightColor"
      v-model:elgato-light-intensity="elgatoLightIntensity"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useExperience } from '@/composables/useExperience'
import Baked from './Baked.vue'
import GoogleLeds from './GoogleLeds.vue'
import CoffeeSteam from './CoffeeSteam.vue'
import TopChair from './TopChair.vue'
import Screen from './Screen.vue'
import ElgatoLight from './ElgatoLight.vue'
import LoupedeckButtons from './LoupedeckButtons.vue'
import DebugGUI from './DebugGUI.vue'

// Refs
const containerRef = ref<HTMLElement | null>(null)

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
  destroy
} = useExperience()

// 调试模式
const debugEnabled = ref(window.innerWidth > 420)

// 场景设置
const sunMode = ref<'day' | 'night' | 'neutral'>('day')
const elgatoLightColor = ref('#ffeedd')
const elgatoLightIntensity = ref(1)

// 生命周期
onMounted(async () => {
  if (containerRef.value) {
    // 初始化 Three.js
    setContainer(containerRef.value)

    // 开始渲染循环
    start()

    // 加载资源
    await loadResources()
  }
})

// 清理
onUnmounted(() => {
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
</style>
