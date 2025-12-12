<template>
  <div class="top-chair"></div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { gsap } from '@/core/utils/Animation'
import { getResources } from '@/composables/useResources'

// Props
interface Props {
  scene: THREE.Scene | null
}

const props = defineProps<Props>()

// 资源管理器
const resources = getResources()

// Three.js 对象（使用 shallowRef 避免 Proxy 冲突）
const chairGroup = shallowRef<THREE.Group | null>(null)
const chairModel = shallowRef<THREE.Object3D | null>(null)

// 动画
const rotationAnimation = ref<any>(null)

/**
 * 初始化椅子
 */
const initTopChair = () => {
  if (!props.scene) return

  // 获取模型
  const chairGltf = resources.getModel('topChairModel')

  if (!chairGltf) {
    console.warn('Top chair model not loaded')
    return
  }

  // 创建组
  chairGroup.value = new THREE.Group()
  chairGroup.value.name = 'TopChair'

  // 获取椅子模型
  chairModel.value = chairGltf.scene

  // 遍历模型设置材质
  chairGltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // 使用原有材质或创建基础材质
      if (!child.material) {
        child.material = new THREE.MeshBasicMaterial({ color: 0x333333 })
      }
    }
  })

  // 添加模型到组
  chairGroup.value.add(chairGltf.scene)

  // 添加到场景
  props.scene.add(chairGroup.value)

  // 创建旋转动画
  startRotationAnimation()
}

/**
 * 启动旋转动画
 */
const startRotationAnimation = () => {
  if (!chairModel.value) return

  // 慢速旋转动画
  rotationAnimation.value = gsap.to(chairModel.value.rotation, {
    y: Math.PI * 2,
    duration: 20,
    repeat: -1,
    ease: 'none'
  })
}

/**
 * 销毁
 */
const destroy = () => {
  // 停止动画
  if (rotationAnimation.value) {
    rotationAnimation.value.kill()
    rotationAnimation.value = null
  }

  // 移除场景
  if (chairGroup.value && props.scene) {
    props.scene.remove(chairGroup.value)
    chairGroup.value.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
    })
  }

  chairGroup.value = null
  chairModel.value = null
}

// 监听资源加载完成
watch(() => resources.isLoading.value, (loading) => {
  if (!loading && props.scene) {
    initTopChair()
  }
}, { immediate: true })

// 监听场景变化
watch(() => props.scene, (newScene) => {
  if (newScene && !resources.isLoading.value) {
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
  chairGroup
})
</script>

<style scoped>
.top-chair {
  /* Three.js 网格直接添加到场景，无 DOM 元素 */
}
</style>
