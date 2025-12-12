<template>
  <div class="top-chair"></div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { getResources } from '@/composables/useResources'

// Props
interface Props {
  scene: THREE.Scene | null
  bakedMaterial: THREE.ShaderMaterial | null
}

const props = defineProps<Props>()

// 资源管理器
const resources = getResources()

// Three.js 对象（使用 shallowRef 避免 Proxy 冲突）
const chairModel = shallowRef<THREE.Object3D | null>(null)

// 动画
const animationFrame = ref<number | null>(null)
const startTime = ref(Date.now())

/**
 * 初始化椅子
 */
const initTopChair = () => {
  if (!props.scene || !props.bakedMaterial) return

  // 获取模型
  const chairGltf = resources.getModel('topChairModel')

  if (!chairGltf) {
    console.warn('Top chair model not loaded')
    return
  }

  // 获取椅子模型（使用第一个子对象）
  chairModel.value = chairGltf.scene.children[0]

  // 应用房间材质
  chairModel.value.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = props.bakedMaterial
    }
  })

  // 添加到场景
  props.scene.add(chairModel.value)

  // 启动动画
  animate()
}

/**
 * 摇摆动画
 */
const animate = () => {
  if (chairModel.value) {
    const elapsed = Date.now() - startTime.value
    // 摇摆动画（不是完整旋转）
    chairModel.value.rotation.y = Math.sin(elapsed * 0.0005) * 0.5
  }

  animationFrame.value = requestAnimationFrame(animate)
}

/**
 * 销毁
 */
const destroy = () => {
  // 停止动画
  if (animationFrame.value !== null) {
    cancelAnimationFrame(animationFrame.value)
    animationFrame.value = null
  }

  // 移除场景（不销毁材质，因为是共享的）
  if (chairModel.value && props.scene) {
    props.scene.remove(chairModel.value)
  }

  chairModel.value = null
}

// 监听资源加载完成和材质准备好
watch([
  () => resources.isLoading.value,
  () => props.bakedMaterial
], ([loading, material]) => {
  if (!loading && material && props.scene) {
    initTopChair()
  }
}, { immediate: true })

// 监听场景变化
watch(() => props.scene, (newScene) => {
  if (newScene && !resources.isLoading.value && props.bakedMaterial) {
    destroy()
    initTopChair()
  }
})

// 生命周期
onUnmounted(() => {
  destroy()
})

// 暴露方法
defineExpose({
  chairModel
})
</script>

<style scoped>
.top-chair {
  /* Three.js 网格直接添加到场景，无 DOM 元素 */
}
</style>
