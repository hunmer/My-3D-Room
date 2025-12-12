<template>
  <div class="loupedeck-buttons"></div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { gsap } from '@/core/utils/Animation'
import { getResources } from '@/composables/useResources'
import { getInteraction } from '@/composables/useInteraction'

// Props
interface Props {
  scene: THREE.Scene | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  click: [object: THREE.Object3D, event: MouseEvent]
}>()

// 资源管理器
const resources = getResources()

// 交互系统
const interaction = getInteraction()

// Three.js 对象（使用 shallowRef 避免 Proxy 冲突）
const buttonsGroup = shallowRef<THREE.Group | null>(null)
const buttonMaterials = shallowRef<THREE.MeshBasicMaterial[]>([])

// 动画
const animations = ref<any[]>([])

// 取消注册函数
const unregisterInteraction = ref<(() => void) | null>(null)

// 按钮颜色
const buttonColors = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ffeaa7', '#dfe6e9', '#fd79a8', '#00b894',
  '#e17055', '#0984e3', '#6c5ce7', '#fdcb6e'
]

/**
 * 初始化 Loupedeck 按钮
 */
const initLoupedeckButtons = () => {
  if (!props.scene) return

  // 获取模型
  const buttonsGltf = resources.getModel('loupedeckButtonsModel')

  if (!buttonsGltf) {
    console.warn('Loupedeck buttons model not loaded')
    return
  }

  // 创建组
  buttonsGroup.value = new THREE.Group()
  buttonsGroup.value.name = 'LoupedeckButtons'

  // 遍历模型设置材质和动画
  let buttonIndex = 0
  buttonsGltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // 创建发光材质
      const color = buttonColors[buttonIndex % buttonColors.length]
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.8
      })

      child.material = material
      buttonMaterials.value.push(material)

      // 创建闪烁动画
      const animation = gsap.to(material, {
        opacity: () => 0.4 + Math.random() * 0.6,
        duration: 0.5 + Math.random() * 1,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut',
        delay: buttonIndex * 0.1
      })
      animations.value.push(animation)

      buttonIndex++
    }
  })

  // 添加模型到组
  buttonsGroup.value.add(buttonsGltf.scene)

  // 添加到场景
  props.scene.add(buttonsGroup.value)

  // 注册点击交互
  unregisterInteraction.value = interaction.registerGroup(buttonsGroup.value, {
    name: 'LoupedeckButtons',
    bounceScale: 1.25,
    bounceDuration: 0.1,
    onClick: (object, event) => {
      emit('click', object, event)
    }
  })
}

/**
 * 销毁
 */
const destroy = () => {
  // 取消注册交互
  if (unregisterInteraction.value) {
    unregisterInteraction.value()
    unregisterInteraction.value = null
  }

  // 停止动画
  animations.value.forEach(anim => anim?.kill())
  animations.value = []

  // 清理材质
  buttonMaterials.value.forEach(mat => mat.dispose())
  buttonMaterials.value = []

  // 移除场景
  if (buttonsGroup.value && props.scene) {
    props.scene.remove(buttonsGroup.value)
    buttonsGroup.value.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
      }
    })
  }

  buttonsGroup.value = null
}

// 监听资源加载完成
watch(() => resources.isLoading.value, (loading) => {
  if (!loading && props.scene) {
    initLoupedeckButtons()
  }
}, { immediate: true })

// 监听场景变化
watch(() => props.scene, (newScene) => {
  if (newScene && !resources.isLoading.value) {
    destroy()
    initLoupedeckButtons()
  }
})

// 生命周期
onUnmounted(() => {
  destroy()
})

// 暴露方法
defineExpose({
  buttonsGroup
})
</script>

<style scoped>
.loupedeck-buttons {
  /* Three.js 网格直接添加到场景，无 DOM 元素 */
}
</style>
