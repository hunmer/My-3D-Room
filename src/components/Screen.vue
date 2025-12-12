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
const screenGroup = shallowRef<THREE.Group | null>(null)
const pcScreenMesh = shallowRef<THREE.Mesh | null>(null)
const macScreenMesh = shallowRef<THREE.Mesh | null>(null)
const pcVideoTexture = shallowRef<THREE.VideoTexture | null>(null)
const macVideoTexture = shallowRef<THREE.VideoTexture | null>(null)

/**
 * 初始化屏幕
 */
const initScreen = () => {
  if (!props.scene) return

  // 获取模型
  const pcScreenGltf = resources.getModel('pcScreenModel')
  const macScreenGltf = resources.getModel('macScreenModel')

  // 获取视频
  const pcVideo = resources.getVideo('pcScreenVideo')
  const macVideo = resources.getVideo('macScreenVideo')

  if (!pcScreenGltf || !macScreenGltf) {
    console.warn('Screen models not loaded')
    return
  }

  // 创建组
  screenGroup.value = new THREE.Group()
  screenGroup.value.name = 'Screens'

  // 创建 PC 屏幕视频纹理
  if (pcVideo) {
    pcVideoTexture.value = new THREE.VideoTexture(pcVideo)
    pcVideoTexture.value.flipY = false
    pcVideoTexture.value.colorSpace = THREE.SRGBColorSpace
  }

  // 创建 Mac 屏幕视频纹理
  if (macVideo) {
    macVideoTexture.value = new THREE.VideoTexture(macVideo)
    macVideoTexture.value.flipY = false
    macVideoTexture.value.colorSpace = THREE.SRGBColorSpace
  }

  // 处理 PC 屏幕
  pcScreenGltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      pcScreenMesh.value = child
      if (pcVideoTexture.value) {
        child.material = new THREE.MeshBasicMaterial({
          map: pcVideoTexture.value
        })
      }
    }
  })

  // 处理 Mac 屏幕
  macScreenGltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      macScreenMesh.value = child
      if (macVideoTexture.value) {
        child.material = new THREE.MeshBasicMaterial({
          map: macVideoTexture.value
        })
      }
    }
  })

  // 添加模型到组
  screenGroup.value.add(pcScreenGltf.scene)
  screenGroup.value.add(macScreenGltf.scene)

  // 添加到场景
  props.scene.add(screenGroup.value)
}

/**
 * 销毁
 */
const destroy = () => {
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
  if (screenGroup.value && props.scene) {
    props.scene.remove(screenGroup.value)
    screenGroup.value.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
    })
  }

  screenGroup.value = null
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
  screenGroup
})
</script>

<style scoped>
.screen {
  /* Three.js 网格直接添加到场景，无 DOM 元素 */
}
</style>
