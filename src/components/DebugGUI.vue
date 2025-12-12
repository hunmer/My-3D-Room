<template>
  <div class="debug-gui" ref="guiContainer"></div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, watch } from 'vue'
import { Pane } from 'tweakpane'

// Props
interface Props {
  nightMix: number
  neutralMix: number
  tvColor: string
  tvStrength: number
  deskColor: string
  deskStrength: number
  pcColor: string
  pcStrength: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:nightMix': [value: number]
  'update:neutralMix': [value: number]
  'update:tvColor': [value: string]
  'update:tvStrength': [value: number]
  'update:deskColor': [value: string]
  'update:deskStrength': [value: number]
  'update:pcColor': [value: string]
  'update:pcStrength': [value: number]
}>()

// Refs
const guiContainer = ref<HTMLElement | null>(null)
const pane = shallowRef<Pane | null>(null)

// 内部状态（用于 Tweakpane 绑定）
const settings = ref({
  nightMix: props.nightMix,
  neutralMix: props.neutralMix,
  tvColor: props.tvColor,
  tvStrength: props.tvStrength,
  deskColor: props.deskColor,
  deskStrength: props.deskStrength,
  pcColor: props.pcColor,
  pcStrength: props.pcStrength
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

  // 环境光文件夹
  const envFolder = pane.value.addFolder({
    title: '环境光',
    expanded: true
  })

  envFolder.addInput(settings.value, 'nightMix', {
    label: '夜晚混合',
    min: 0,
    max: 1,
    step: 0.01
  }).on('change', (ev) => {
    emit('update:nightMix', ev.value)
  })

  envFolder.addInput(settings.value, 'neutralMix', {
    label: '中性混合',
    min: 0,
    max: 1,
    step: 0.01
  }).on('change', (ev) => {
    emit('update:neutralMix', ev.value)
  })

  // 电视灯光文件夹
  const tvFolder = pane.value.addFolder({
    title: '电视灯光',
    expanded: false
  })

  tvFolder.addInput(settings.value, 'tvColor', {
    label: '颜色',
    view: 'color'
  }).on('change', (ev) => {
    emit('update:tvColor', ev.value)
  })

  tvFolder.addInput(settings.value, 'tvStrength', {
    label: '强度',
    min: 0,
    max: 3,
    step: 0.01
  }).on('change', (ev) => {
    emit('update:tvStrength', ev.value)
  })

  // 桌面灯光文件夹
  const deskFolder = pane.value.addFolder({
    title: '桌面灯光',
    expanded: false
  })

  deskFolder.addInput(settings.value, 'deskColor', {
    label: '颜色',
    view: 'color'
  }).on('change', (ev) => {
    emit('update:deskColor', ev.value)
  })

  deskFolder.addInput(settings.value, 'deskStrength', {
    label: '强度',
    min: 0,
    max: 3,
    step: 0.01
  }).on('change', (ev) => {
    emit('update:deskStrength', ev.value)
  })

  // PC 灯光文件夹
  const pcFolder = pane.value.addFolder({
    title: 'PC 灯光',
    expanded: false
  })

  pcFolder.addInput(settings.value, 'pcColor', {
    label: '颜色',
    view: 'color'
  }).on('change', (ev) => {
    emit('update:pcColor', ev.value)
  })

  pcFolder.addInput(settings.value, 'pcStrength', {
    label: '强度',
    min: 0,
    max: 3,
    step: 0.01
  }).on('change', (ev) => {
    emit('update:pcStrength', ev.value)
  })

  // 预设按钮
  pane.value.addButton({
    title: '白天模式'
  }).on('click', () => {
    settings.value.nightMix = 0
    settings.value.neutralMix = 0
    emit('update:nightMix', 0)
    emit('update:neutralMix', 0)
    pane.value?.refresh()
  })

  pane.value.addButton({
    title: '夜晚模式'
  }).on('click', () => {
    settings.value.nightMix = 1
    settings.value.neutralMix = 0
    emit('update:nightMix', 1)
    emit('update:neutralMix', 0)
    pane.value?.refresh()
  })

  pane.value.addButton({
    title: '中性模式'
  }).on('click', () => {
    settings.value.nightMix = 0
    settings.value.neutralMix = 1
    emit('update:nightMix', 0)
    emit('update:neutralMix', 1)
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
watch(() => props.nightMix, (v) => { settings.value.nightMix = v; pane.value?.refresh() })
watch(() => props.neutralMix, (v) => { settings.value.neutralMix = v; pane.value?.refresh() })
watch(() => props.tvColor, (v) => { settings.value.tvColor = v; pane.value?.refresh() })
watch(() => props.tvStrength, (v) => { settings.value.tvStrength = v; pane.value?.refresh() })
watch(() => props.deskColor, (v) => { settings.value.deskColor = v; pane.value?.refresh() })
watch(() => props.deskStrength, (v) => { settings.value.deskStrength = v; pane.value?.refresh() })
watch(() => props.pcColor, (v) => { settings.value.pcColor = v; pane.value?.refresh() })
watch(() => props.pcStrength, (v) => { settings.value.pcStrength = v; pane.value?.refresh() })

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
