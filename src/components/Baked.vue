<template>
  <div class="baked-room"></div>
</template>

<script setup lang="ts">
import { shallowRef, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { getResources } from '@/composables/useResources'

// Props
interface Props {
  scene: THREE.Scene | null
  sunMode?: 'day' | 'night' | 'neutral'
}

const props = withDefaults(defineProps<Props>(), {
  sunMode: 'day'
})

// 资源管理器
const resources = getResources()

// Three.js 对象（使用 shallowRef 避免 Proxy 冲突）
const roomGroup = shallowRef<THREE.Group | null>(null)
const bakedMaterial = shallowRef<THREE.MeshBasicMaterial | null>(null)

// 纹理引用
const textures = shallowRef<{
  day: THREE.Texture | null
  night: THREE.Texture | null
  neutral: THREE.Texture | null
  lightMap: THREE.Texture | null
}>({
  day: null,
  night: null,
  neutral: null,
  lightMap: null
})

/**
 * 初始化房间
 */
const initBaked = () => {
  if (!props.scene) return

  // 获取模型
  const roomGltf = resources.getModel('roomModel')
  if (!roomGltf) {
    console.warn('Room model not loaded')
    return
  }

  // 获取纹理
  textures.value = {
    day: resources.getTexture('bakedDayTexture') || null,
    night: resources.getTexture('bakedNightTexture') || null,
    neutral: resources.getTexture('bakedNeutralTexture') || null,
    lightMap: resources.getTexture('lightMapTexture') || null
  }

  // 获取当前纹理
  const currentTexture = getCurrentTexture()
  if (!currentTexture) {
    console.warn('Baked texture not loaded')
    return
  }

  // 创建材质
  bakedMaterial.value = new THREE.MeshBasicMaterial({
    map: currentTexture
  })

  // 创建房间组
  roomGroup.value = new THREE.Group()
  roomGroup.value.name = 'BakedRoom'

  // 遍历模型并应用材质
  roomGltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = bakedMaterial.value
    }
  })

  // 添加模型到组
  roomGroup.value.add(roomGltf.scene)

  // 添加到场景
  props.scene.add(roomGroup.value)
}

/**
 * 获取当前模式的纹理
 */
const getCurrentTexture = (): THREE.Texture | null => {
  switch (props.sunMode) {
    case 'day':
      return textures.value.day
    case 'night':
      return textures.value.night
    case 'neutral':
      return textures.value.neutral
    default:
      return textures.value.day
  }
}

/**
 * 更新纹理（切换日夜模式）
 */
const updateTexture = () => {
  if (!bakedMaterial.value) return

  const currentTexture = getCurrentTexture()
  if (currentTexture) {
    bakedMaterial.value.map = currentTexture
    bakedMaterial.value.needsUpdate = true
  }
}

/**
 * 销毁
 */
const destroy = () => {
  if (roomGroup.value && props.scene) {
    props.scene.remove(roomGroup.value)

    roomGroup.value.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
    })
  }

  roomGroup.value = null
  bakedMaterial.value = null
}

// 监听资源加载完成
watch(() => resources.isLoading.value, (loading) => {
  if (!loading && props.scene) {
    initBaked()
  }
}, { immediate: true })

// 监听场景变化
watch(() => props.scene, (newScene) => {
  if (newScene && !resources.isLoading.value) {
    destroy()
    initBaked()
  }
})

// 监听日夜模式变化
watch(() => props.sunMode, () => {
  updateTexture()
})

// 生命周期
onUnmounted(() => {
  destroy()
})

// 暴露方法
defineExpose({
  roomGroup,
  updateTexture
})
</script>

<style scoped>
.baked-room {
  /* Three.js 网格直接添加到场景，无 DOM 元素 */
}
</style>
