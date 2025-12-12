<template>
  <Teleport to="body">
    <Transition name="editor-fade">
      <div v-if="visible" class="model-editor-overlay" @click.self="handleClose">
        <div class="model-editor-panel">
          <!-- 标题栏 -->
          <div class="editor-header">
            <h3 class="editor-title">{{ title }}</h3>
            <button class="close-btn" @click="handleClose" title="关闭">×</button>
          </div>

          <!-- 内容区 -->
          <div class="editor-content">
            <!-- 位置控制 -->
            <div class="control-group">
              <h4 class="group-title">位置</h4>
              <div class="control-row">
                <label>X</label>
                <input
                  type="range"
                  :min="positionRange.min"
                  :max="positionRange.max"
                  :step="positionRange.step"
                  :value="position.x"
                  @input="updatePosition('x', $event)"
                />
                <input
                  type="number"
                  :step="positionRange.step"
                  :value="position.x.toFixed(2)"
                  @change="updatePositionInput('x', $event)"
                  class="number-input"
                />
              </div>
              <div class="control-row">
                <label>Y</label>
                <input
                  type="range"
                  :min="positionRange.min"
                  :max="positionRange.max"
                  :step="positionRange.step"
                  :value="position.y"
                  @input="updatePosition('y', $event)"
                />
                <input
                  type="number"
                  :step="positionRange.step"
                  :value="position.y.toFixed(2)"
                  @change="updatePositionInput('y', $event)"
                  class="number-input"
                />
              </div>
              <div class="control-row">
                <label>Z</label>
                <input
                  type="range"
                  :min="positionRange.min"
                  :max="positionRange.max"
                  :step="positionRange.step"
                  :value="position.z"
                  @input="updatePosition('z', $event)"
                />
                <input
                  type="number"
                  :step="positionRange.step"
                  :value="position.z.toFixed(2)"
                  @change="updatePositionInput('z', $event)"
                  class="number-input"
                />
              </div>
            </div>

            <!-- 目标尺寸控制 -->
            <div class="control-group">
              <h4 class="group-title">目标尺寸</h4>
              <div class="control-row">
                <label>大小</label>
                <input
                  type="range"
                  :min="targetSizeRange.min"
                  :max="targetSizeRange.max"
                  :step="targetSizeRange.step"
                  :value="targetSize"
                  @input="updateTargetSize($event)"
                />
                <input
                  type="number"
                  :step="targetSizeRange.step"
                  :value="targetSize.toFixed(2)"
                  @change="updateTargetSizeInput($event)"
                  class="number-input"
                />
                <span class="unit">m</span>
              </div>
            </div>

            <!-- 旋转控制 -->
            <div class="control-group">
              <h4 class="group-title">旋转</h4>
              <div class="control-row">
                <label>Y轴</label>
                <input
                  type="range"
                  :min="0"
                  :max="360"
                  :step="1"
                  :value="rotationDegrees"
                  @input="updateRotation($event)"
                />
                <input
                  type="number"
                  :min="0"
                  :max="360"
                  :step="1"
                  :value="Math.round(rotationDegrees)"
                  @change="updateRotationInput($event)"
                  class="number-input"
                />
                <span class="unit">°</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <button class="btn btn-reset" @click="handleReset">重置</button>
              <button class="btn btn-copy" @click="handleCopyConfig">复制配置</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
  visible: boolean
  title?: string
  position: { x: number; y: number; z: number }
  targetSize: number // 目标尺寸（场景单位）
  rotation: { x: number; y: number; z: number }
  positionRange?: { min: number; max: number; step: number }
  targetSizeRange?: { min: number; max: number; step: number }
  defaultPosition?: { x: number; y: number; z: number }
  defaultTargetSize?: number
  defaultRotation?: { x: number; y: number; z: number }
}

const props = withDefaults(defineProps<Props>(), {
  title: '模型编辑器',
  positionRange: () => ({ min: -5, max: 5, step: 0.05 }),
  targetSizeRange: () => ({ min: 0.1, max: 3, step: 0.05 }),
  defaultPosition: () => ({ x: 0, y: 0, z: 0 }),
  defaultTargetSize: 0.6,
  defaultRotation: () => ({ x: 0, y: 0, z: 0 })
})

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:position': [value: { x: number; y: number; z: number }]
  'update:targetSize': [value: number]
  'update:rotation': [value: { x: number; y: number; z: number }]
  close: []
}>()

// 旋转角度（弧度转度数）
const rotationDegrees = computed(() => {
  return (props.rotation.y * 180) / Math.PI
})

// 更新位置
const updatePosition = (axis: 'x' | 'y' | 'z', event: Event) => {
  const value = parseFloat((event.target as HTMLInputElement).value)
  const newPosition = { ...props.position, [axis]: value }
  emit('update:position', newPosition)
}

const updatePositionInput = (axis: 'x' | 'y' | 'z', event: Event) => {
  const value = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(value)) {
    const newPosition = { ...props.position, [axis]: value }
    emit('update:position', newPosition)
  }
}

// 更新目标尺寸
const updateTargetSize = (event: Event) => {
  const value = parseFloat((event.target as HTMLInputElement).value)
  emit('update:targetSize', value)
}

const updateTargetSizeInput = (event: Event) => {
  const value = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(value) && value > 0) {
    emit('update:targetSize', value)
  }
}

// 更新旋转
const updateRotation = (event: Event) => {
  const degrees = parseFloat((event.target as HTMLInputElement).value)
  const radians = (degrees * Math.PI) / 180
  const newRotation = { ...props.rotation, y: radians }
  emit('update:rotation', newRotation)
}

const updateRotationInput = (event: Event) => {
  const degrees = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(degrees)) {
    const radians = (degrees * Math.PI) / 180
    const newRotation = { ...props.rotation, y: radians }
    emit('update:rotation', newRotation)
  }
}

// 重置
const handleReset = () => {
  emit('update:position', { ...props.defaultPosition })
  emit('update:targetSize', props.defaultTargetSize)
  emit('update:rotation', { ...props.defaultRotation })
}

// 复制配置到剪贴板
const handleCopyConfig = async () => {
  const config = {
    position: props.position,
    targetSize: props.targetSize,
    rotation: props.rotation
  }
  const configStr = JSON.stringify(config, null, 2)

  try {
    await navigator.clipboard.writeText(configStr)
    alert('配置已复制到剪贴板')
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = configStr
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('配置已复制到剪贴板')
  }
}

// 关闭
const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}
</script>

<style scoped>
.model-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.model-editor-panel {
  background: #1a1a2e;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  min-width: 320px;
  max-width: 400px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.editor-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #ff6b6b;
}

.editor-content {
  padding: 20px;
}

.control-group {
  margin-bottom: 20px;
}

.control-group:last-of-type {
  margin-bottom: 16px;
}

.group-title {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 500;
  color: #00d4ff;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.control-row label {
  width: 24px;
  font-size: 13px;
  color: #aaa;
  font-weight: 500;
}

.control-row input[type="range"] {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #2d2d44;
  outline: none;
  -webkit-appearance: none;
}

.control-row input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #00d4ff;
  cursor: pointer;
  transition: transform 0.15s;
}

.control-row input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.number-input {
  width: 70px;
  padding: 6px 8px;
  border: 1px solid #3d3d5c;
  border-radius: 6px;
  background: #252538;
  color: #e0e0e0;
  font-size: 12px;
  text-align: center;
}

.number-input:focus {
  outline: none;
  border-color: #00d4ff;
}

.unit {
  font-size: 12px;
  color: #666;
  width: 16px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset {
  background: #3d3d5c;
  color: #e0e0e0;
}

.btn-reset:hover {
  background: #4d4d6c;
}

.btn-copy {
  background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%);
  color: #fff;
}

.btn-copy:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

/* 过渡动画 */
.editor-fade-enter-active,
.editor-fade-leave-active {
  transition: opacity 0.2s ease;
}

.editor-fade-enter-active .model-editor-panel,
.editor-fade-leave-active .model-editor-panel {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.editor-fade-enter-from,
.editor-fade-leave-to {
  opacity: 0;
}

.editor-fade-enter-from .model-editor-panel,
.editor-fade-leave-to .model-editor-panel {
  transform: scale(0.95);
  opacity: 0;
}
</style>
