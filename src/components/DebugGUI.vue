<template>
  <div class="debug-gui" ref="guiContainer"></div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, watch } from 'vue'
import { Pane } from 'tweakpane'

// Props
interface Props {
  sunMode: 'day' | 'night' | 'neutral'
  elgatoLightColor: string
  elgatoLightIntensity: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:sunMode': [value: 'day' | 'night' | 'neutral']
  'update:elgatoLightColor': [value: string]
  'update:elgatoLightIntensity': [value: number]
}>()

// Refs
const guiContainer = ref<HTMLElement | null>(null)
const pane = shallowRef<Pane | null>(null)

// 内部状态（用于 Tweakpane 绑定）
const settings = ref({
  sunMode: props.sunMode,
  elgatoLight: {
    color: props.elgatoLightColor,
    intensity: props.elgatoLightIntensity
  }
})

/**
 * 初始化 GUI
 */
const initGUI = () => {
  if (!guiContainer.value) return

  // 创建 Tweakpane
  pane.value = new Pane({
    title: '场景控制',
    container: guiContainer.value
  })

  // 日夜模式选择
  const sunModeOptions = {
    '白天': 'day',
    '夜晚': 'night',
    '中性': 'neutral'
  }

  pane.value.addInput(settings.value, 'sunMode', {
    label: '环境光',
    options: sunModeOptions
  }).on('change', (ev) => {
    emit('update:sunMode', ev.value as 'day' | 'night' | 'neutral')
  })

  // Elgato 灯光文件夹
  const elgatoFolder = pane.value.addFolder({
    title: 'Elgato 灯光',
    expanded: true
  })

  elgatoFolder.addInput(settings.value.elgatoLight, 'color', {
    label: '颜色',
    view: 'color'
  }).on('change', (ev) => {
    emit('update:elgatoLightColor', ev.value)
  })

  elgatoFolder.addInput(settings.value.elgatoLight, 'intensity', {
    label: '强度',
    min: 0,
    max: 1,
    step: 0.01
  }).on('change', (ev) => {
    emit('update:elgatoLightIntensity', ev.value)
  })

  // 添加重置按钮
  pane.value.addButton({
    title: '重置设置'
  }).on('click', () => {
    settings.value.sunMode = 'day'
    settings.value.elgatoLight.color = '#ffeedd'
    settings.value.elgatoLight.intensity = 1

    emit('update:sunMode', 'day')
    emit('update:elgatoLightColor', '#ffeedd')
    emit('update:elgatoLightIntensity', 1)

    pane.value?.refresh()
  })
}

/**
 * 销毁
 */
const destroy = () => {
  if (pane.value) {
    pane.value.dispose()
    pane.value = null
  }
}

// 同步外部 props 变化到内部状态
watch(() => props.sunMode, (newValue) => {
  settings.value.sunMode = newValue
  pane.value?.refresh()
})

watch(() => props.elgatoLightColor, (newValue) => {
  settings.value.elgatoLight.color = newValue
  pane.value?.refresh()
})

watch(() => props.elgatoLightIntensity, (newValue) => {
  settings.value.elgatoLight.intensity = newValue
  pane.value?.refresh()
})

// 生命周期
onMounted(() => {
  initGUI()
})

onUnmounted(() => {
  destroy()
})

// 暴露方法
defineExpose({
  pane
})
</script>

<style scoped>
.debug-gui {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

/* Tweakpane 样式覆盖 */
.debug-gui :deep(.tp-dfwv) {
  min-width: 280px;
}
</style>
