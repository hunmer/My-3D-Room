<template>
  <div class="google-leds"></div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { gsap } from '@/core/utils/Animation'
import { getResources } from '@/composables/useResources'

// Props
interface Props {
  scene: THREE.Scene | null
  time?: number
}

const props = withDefaults(defineProps<Props>(), {
  time: 0
})

// 资源管理器
const resources = getResources()

// Three.js 对象（使用 shallowRef 避免 Proxy 冲突）
const ledGroup = shallowRef<THREE.Group | null>(null)
const ledMeshes = shallowRef<THREE.Mesh[]>([])
const ledMaterials = shallowRef<THREE.MeshBasicMaterial[]>([])

// 动画实例
const animations = ref<any[]>([])

// LED 颜色配置（Google 品牌色）
const colors = ['#4285f4', '#ea4335', '#fbbc04', '#34a853']

/**
 * 初始化 Google LEDs
 */
const initGoogleLeds = () => {
  if (!props.scene) return

  // 获取模型
  const ledsGltf = resources.getModel('googleHomeLedsModel')
  const maskTexture = resources.getTexture('googleHomeLedMaskTexture')

  if (!ledsGltf) {
    console.warn('Google LEDs model not loaded')
    return
  }

  // 创建组
  ledGroup.value = new THREE.Group()
  ledGroup.value.name = 'GoogleLeds'

  // 遍历模型找到 LED 网格
  let ledIndex = 0
  ledsGltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh && ledIndex < 4) {
      // 创建 LED 材质
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors[ledIndex]),
        transparent: true,
        opacity: 1,
        alphaMap: maskTexture || undefined
      })

      child.material = material
      ledMeshes.value.push(child)
      ledMaterials.value.push(material)

      // 创建闪烁动画
      const animation = gsap.to(material, {
        opacity: () => 0.3 + Math.random() * 0.7,
        duration: 1.5 + Math.random() * 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut',
        delay: ledIndex * 0.2
      })
      animations.value.push(animation)

      ledIndex++
    }
  })

  // 添加模型到组
  ledGroup.value.add(ledsGltf.scene)

  // 添加到场景
  props.scene.add(ledGroup.value)
}

/**
 * 销毁
 */
const destroy = () => {
  // 停止动画
  animations.value.forEach(anim => anim?.kill())
  animations.value = []

  // 清理材质
  ledMaterials.value.forEach(mat => mat.dispose())
  ledMaterials.value = []
  ledMeshes.value = []

  // 移除场景
  if (ledGroup.value && props.scene) {
    props.scene.remove(ledGroup.value)
    ledGroup.value.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
      }
    })
  }

  ledGroup.value = null
}

// 监听资源加载完成
watch(() => resources.isLoading.value, (loading) => {
  if (!loading && props.scene) {
    initGoogleLeds()
  }
}, { immediate: true })

// 监听场景变化
watch(() => props.scene, (newScene) => {
  if (newScene && !resources.isLoading.value) {
    destroy()
    initGoogleLeds()
  }
})

// 生命周期
onUnmounted(() => {
  destroy()
})

// 暴露方法
defineExpose({
  ledGroup
})
</script>

<style scoped>
.google-leds {
  /* Three.js 网格直接添加到场景，无 DOM 元素 */
}
</style>
