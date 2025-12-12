<template>
  <div class="elgato-light"></div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { getResources } from '@/composables/useResources'

// Props
interface Props {
  scene: THREE.Scene | null
  color?: string
  intensity?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: '#ffeedd',
  intensity: 1
})

// 资源管理器
const resources = getResources()

// Three.js 对象（使用 shallowRef 避免 Proxy 冲突）
const lightGroup = shallowRef<THREE.Group | null>(null)
const lightMaterial = shallowRef<THREE.MeshBasicMaterial | null>(null)

/**
 * 初始化 Elgato 灯光
 */
const initElgatoLight = () => {
  if (!props.scene) return

  // 获取模型
  const lightGltf = resources.getModel('elgatoLightModel')

  if (!lightGltf) {
    console.warn('Elgato light model not loaded')
    return
  }

  // 创建材质
  lightMaterial.value = new THREE.MeshBasicMaterial({
    color: new THREE.Color(props.color),
    transparent: true,
    opacity: props.intensity
  })

  // 创建组
  lightGroup.value = new THREE.Group()
  lightGroup.value.name = 'ElgatoLight'

  // 遍历模型设置材质
  lightGltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = lightMaterial.value
    }
  })

  // 添加模型到组
  lightGroup.value.add(lightGltf.scene)

  // 添加到场景
  props.scene.add(lightGroup.value)
}

/**
 * 更新颜色
 */
const updateColor = (color: string) => {
  if (lightMaterial.value) {
    lightMaterial.value.color.set(color)
  }
}

/**
 * 更新强度
 */
const updateIntensity = (intensity: number) => {
  if (lightMaterial.value) {
    lightMaterial.value.opacity = intensity
  }
}

/**
 * 销毁
 */
const destroy = () => {
  // 清理材质
  if (lightMaterial.value) {
    lightMaterial.value.dispose()
    lightMaterial.value = null
  }

  // 移除场景
  if (lightGroup.value && props.scene) {
    props.scene.remove(lightGroup.value)
    lightGroup.value.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
      }
    })
  }

  lightGroup.value = null
}

// 监听资源加载完成
watch(() => resources.isLoading.value, (loading) => {
  if (!loading && props.scene) {
    initElgatoLight()
  }
}, { immediate: true })

// 监听场景变化
watch(() => props.scene, (newScene) => {
  if (newScene && !resources.isLoading.value) {
    destroy()
    initElgatoLight()
  }
})

// 监听颜色变化
watch(() => props.color, (newColor) => {
  updateColor(newColor)
})

// 监听强度变化
watch(() => props.intensity, (newIntensity) => {
  updateIntensity(newIntensity)
})

// 生命周期
onUnmounted(() => {
  destroy()
})

// 暴露方法
defineExpose({
  lightGroup,
  updateColor,
  updateIntensity
})
</script>

<style scoped>
.elgato-light {
  /* Three.js 网格直接添加到场景，无 DOM 元素 */
}
</style>
