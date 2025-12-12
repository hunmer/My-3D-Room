<template>
  <div class="room3d-container" ref="containerRef">
    <!-- 加载进度 -->
    <div v-if="isLoading" class="loading-screen">
      <div class="loading-bar">
        <div class="loading-progress" :style="{ width: loadingProgress + '%' }"></div>
      </div>
      <div class="loading-text">{{ Math.round(loadingProgress) }}%</div>
    </div>

    <!-- 3D 组件 -->
    <GoogleLeds
      v-if="scene"
      :scene="scene"
      :time="elapsedTime"
      :debug="debugEnabled"
      ref="googleLedsRef"
    />

    <!-- 调试面板 -->
    <div v-if="debugEnabled" class="debug-panel">
      <h3>调试面板</h3>
      <div class="debug-controls">
        <div class="control-group">
          <label>像素比例: {{ config.pixelRatio.toFixed(1) }}</label>
          <input type="range" min="0.5" max="2" step="0.1" v-model.number="config.pixelRatio" @input="updatePixelRatio">
        </div>
        <div class="control-group">
          <label>窗口尺寸: {{ config.width }} × {{ config.height }}</label>
        </div>
        <div class="control-group">
          <label>FPS: {{ fps }}</label>
        </div>
        <div class="control-group">
          <label>运行时间: {{ (elapsedTime / 1000).toFixed(1) }}s</label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useExperience } from '@/composables/useExperience'
import GoogleLeds from './GoogleLeds.vue'

// Refs
const containerRef = ref<HTMLElement | null>(null)

// Experience
const {
  scene,
  camera,
  renderer,
  sizes,
  config,
  isLoading,
  loadingProgress,
  setContainer,
  start,
  stop,
  destroy
} = useExperience()

// 3D 组件引用
const googleLedsRef = ref<any>(null)

// 时间相关
const elapsedTime = ref(0)
const animationFrame = ref<number | null>(null)

// 调试相关
const debugEnabled = ref(window.innerWidth > 420)
const fps = ref(0)

// 计算属性
watch(() => config.value.debug, (newVal) => {
  debugEnabled.value = newVal
})

watch(() => sizes.value.width, (newVal) => {
  config.value.debug = newVal > 420
})

// 方法
const updatePixelRatio = () => {
  if (renderer.value) {
    renderer.value.setPixelRatio(config.value.pixelRatio)
  }
}

// 动画循环
const animate = () => {
  // 更新时间
  elapsedTime.value += 16.67 // 约 60fps

  // 更新 3D 组件
  if (googleLedsRef.value && googleLedsRef.value.update) {
    googleLedsRef.value.update(elapsedTime.value)
  }

  animationFrame.value = requestAnimationFrame(animate)
}

// FPS 计算
let fpsInterval: number | null = null
let lastTime = performance.now()

const calculateFPS = () => {
  const now = performance.now()
  const delta = now - lastTime

  if (delta >= 1000) {
    fps.value = Math.round((delta / 1000) * 60)
    lastTime = now
  }

  fpsInterval = requestAnimationFrame(calculateFPS)
}

// 生命周期
onMounted(() => {
  if (containerRef.value) {
    setContainer(containerRef.value)
    start()
  }
  calculateFPS()
  animate() // 启动动画循环
})

// 清理
onUnmounted(() => {
  stop()
  destroy()
  if (animationFrame.value !== null) {
    cancelAnimationFrame(animationFrame.value)
  }
  if (fpsInterval !== null) {
    cancelAnimationFrame(fpsInterval)
  }
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

/* 调试面板 */
.debug-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  border-radius: 8px;
  font-family: 'Roboto', sans-serif;
  font-size: 12px;
  z-index: 100;
  min-width: 250px;
}

.debug-panel h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 300;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 10px;
}

.debug-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.control-group label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.control-group input[type="range"] {
  width: 100%;
  cursor: pointer;
}

/* 响应式 */
@media (max-width: 768px) {
  .debug-panel {
    top: 10px;
    right: 10px;
    left: 10px;
    min-width: auto;
  }
}
</style>
