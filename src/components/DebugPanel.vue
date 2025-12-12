<template>
  <div class="debug-panel" ref="panelRef">
    <h3>调试面板</h3>
    <div class="debug-controls" ref="controlsRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Pane } from 'tweakpane'

// Props
interface Props {
  title?: string
  width?: number
  expanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Debug Panel',
  width: 320,
  expanded: true
})

// Refs
const panelRef = ref<HTMLElement | null>(null)
const controlsRef = ref<HTMLElement | null>(null)
const pane = ref<Pane | null>(null)

/**
 * 初始化 Tweakpane
 */
const initTweakpane = () => {
  if (!panelRef.value || !controlsRef.value) return

  // 创建调试面板
  pane.value = new Pane({
    title: props.title,
    width: props.width
  })

  // 设置面板容器
  if (pane.value.element) {
    pane.value.element.style.position = 'relative'
    pane.value.element.style.zIndex = '1000'

    // 将面板移动到我们的容器中
    if (controlsRef.value && pane.value.element.parentNode) {
      controlsRef.value.appendChild(pane.value.element)
    }
  }
}

/**
 * 添加数字控制
 */
const addNumberControl = (config: any) => {
  if (!pane.value) return null
  return pane.value.addBinding(config, 'value', config)
}

/**
 * 添加颜色控制
 */
const addColorControl = (config: any) => {
  if (!pane.value) return null
  return pane.value.addBinding(config, 'value', { ...config, view: 'color' })
}

/**
 * 添加布尔控制
 */
const addBooleanControl = (config: any) => {
  if (!pane.value) return null
  return pane.value.addBinding(config, 'value', config)
}

/**
 * 添加文件夹
 */
const addFolder = (config: any) => {
  if (!pane.value) return null
  return pane.value.addFolder(config)
}

/**
 * 添加按钮
 */
const addButton = (config: any) => {
  if (!pane.value) return null
  return pane.value.addButton(config)
}

/**
 * 移除所有控制
 */
const clear = () => {
  if (pane.value) {
    pane.value.clear()
  }
}

/**
 * 销毁调试面板
 */
const destroy = () => {
  if (pane.value) {
    pane.value.dispose()
    pane.value = null
  }
}

// 暴露方法给父组件
defineExpose({
  pane,
  addNumberControl,
  addColorControl,
  addBooleanControl,
  addFolder,
  addButton,
  clear,
  destroy
})

// 生命周期
onMounted(() => {
  initTweakpane()
})

onUnmounted(() => {
  destroy()
})
</script>

<style scoped>
.debug-panel {
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
</style>
