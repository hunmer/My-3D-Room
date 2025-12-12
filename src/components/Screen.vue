<template>
  <div class="screen"></div>
</template>

<script setup lang="ts">
import { shallowRef, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { getResources } from '@/composables/useResources'

// Props
interface Props {
  scene: THREE.Scene | null
}

const props = defineProps<Props>()

// 资源管理器
const resources = getResources()

// Three.js 对象（使用 shallowRef 避免 Proxy 冲突）
const pcScreenMesh = shallowRef<THREE.Mesh | null>(null)
const macScreenMesh = shallowRef<THREE.Mesh | null>(null)

// 视频元素
const pcVideoElement = shallowRef<HTMLVideoElement | null>(null)
const macVideoElement = shallowRef<HTMLVideoElement | null>(null)

// 视频纹理
const pcVideoTexture = shallowRef<THREE.VideoTexture | null>(null)
const macVideoTexture = shallowRef<THREE.VideoTexture | null>(null)

/**
 * 创建视频播放器
 */
const createVideoPlayer = (sourcePath: string): HTMLVideoElement => {
  const video = document.createElement('video')
  video.muted = true
  video.loop = true
  video.playsInline = true
  video.autoplay = true
  video.src = sourcePath
  video.play()
  return video
}

/**
 * 初始化屏幕
 */
const initScreen = () => {
  if (!props.scene) return

  // 获取模型
  const pcScreenGltf = resources.getModel('pcScreenModel')
  const macScreenGltf = resources.getModel('macScreenModel')

  if (!pcScreenGltf || !macScreenGltf) {
    console.warn('Screen models not loaded')
    return
  }

  // 创建 PC 屏幕
  pcVideoElement.value = createVideoPlayer('/assets/videoPortfolio.mp4')
  pcVideoTexture.value = new THREE.VideoTexture(pcVideoElement.value)
  pcVideoTexture.value.colorSpace = THREE.SRGBColorSpace

  const pcMaterial = new THREE.MeshBasicMaterial({
    map: pcVideoTexture.value
  })

  // 获取 PC 屏幕网格
  pcScreenMesh.value = pcScreenGltf.scene.children[0] as THREE.Mesh
  pcScreenMesh.value.material = pcMaterial
  props.scene.add(pcScreenMesh.value)

  // 创建 Mac 屏幕
  macVideoElement.value = createVideoPlayer('/assets/videoStream.mp4')
  macVideoTexture.value = new THREE.VideoTexture(macVideoElement.value)
  macVideoTexture.value.colorSpace = THREE.SRGBColorSpace

  const macMaterial = new THREE.MeshBasicMaterial({
    map: macVideoTexture.value
  })

  // 获取 Mac 屏幕网格
  macScreenMesh.value = macScreenGltf.scene.children[0] as THREE.Mesh
  macScreenMesh.value.material = macMaterial
  props.scene.add(macScreenMesh.value)
}

/**
 * 销毁
 */
const destroy = () => {
  // 停止视频
  if (pcVideoElement.value) {
    pcVideoElement.value.pause()
    pcVideoElement.value.src = ''
    pcVideoElement.value = null
  }
  if (macVideoElement.value) {
    macVideoElement.value.pause()
    macVideoElement.value.src = ''
    macVideoElement.value = null
  }

  // 清理视频纹理
  if (pcVideoTexture.value) {
    pcVideoTexture.value.dispose()
    pcVideoTexture.value = null
  }
  if (macVideoTexture.value) {
    macVideoTexture.value.dispose()
    macVideoTexture.value = null
  }

  // 移除场景
  if (pcScreenMesh.value && props.scene) {
    if (pcScreenMesh.value.material instanceof THREE.Material) {
      pcScreenMesh.value.material.dispose()
    }
    props.scene.remove(pcScreenMesh.value)
  }
  if (macScreenMesh.value && props.scene) {
    if (macScreenMesh.value.material instanceof THREE.Material) {
      macScreenMesh.value.material.dispose()
    }
    props.scene.remove(macScreenMesh.value)
  }

  pcScreenMesh.value = null
  macScreenMesh.value = null
}

// 监听资源加载完成
watch(() => resources.isLoading.value, (loading) => {
  if (!loading && props.scene) {
    initScreen()
  }
}, { immediate: true })

// 监听场景变化
watch(() => props.scene, (newScene) => {
  if (newScene && !resources.isLoading.value) {
    destroy()
    initScreen()
  }
})

// 生命周期
onUnmounted(() => {
  destroy()
})

// 暴露方法
defineExpose({
  pcScreenMesh,
  macScreenMesh
})
</script>

<style scoped>
.screen {
  /* Three.js 网格直接添加到场景，无 DOM 元素 */
}
</style>
