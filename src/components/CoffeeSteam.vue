<template>
  <div class="coffee-steam"></div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { getResources } from '@/composables/useResources'

// 导入着色器
import vertexShader from '@/shaders/coffeeSteam/vertex.glsl'
import fragmentShader from '@/shaders/coffeeSteam/fragment.glsl'

// Props
interface Props {
  scene: THREE.Scene | null
}

const props = defineProps<Props>()

// 资源管理器
const resources = getResources()

// Three.js 对象（使用 shallowRef 避免 Proxy 冲突）
const steamGroup = shallowRef<THREE.Group | null>(null)
const steamMesh = shallowRef<THREE.Mesh | null>(null)
const shaderMaterial = shallowRef<THREE.ShaderMaterial | null>(null)

// 动画
const animationFrame = ref<number | null>(null)
const startTime = ref(Date.now())

/**
 * 初始化咖啡蒸汽
 */
const initCoffeeSteam = () => {
  if (!props.scene) return

  // 获取模型
  const steamGltf = resources.getModel('coffeeSteamModel')

  if (!steamGltf) {
    console.warn('Coffee steam model not loaded')
    return
  }

  // 创建着色器材质
  shaderMaterial.value = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uTimeFrequency: { value: 0.0004 },
      uUvFrequency: { value: new THREE.Vector2(4, 5) },
      uColor: { value: new THREE.Color('#ffffff') }
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  })

  // 创建组
  steamGroup.value = new THREE.Group()
  steamGroup.value.name = 'CoffeeSteam'

  // 遍历模型找到蒸汽网格
  steamGltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = shaderMaterial.value
      steamMesh.value = child
    }
  })

  // 添加模型到组
  steamGroup.value.add(steamGltf.scene)

  // 添加到场景
  props.scene.add(steamGroup.value)

  // 启动动画
  animate()
}

/**
 * 动画循环
 */
const animate = () => {
  if (shaderMaterial.value) {
    const elapsed = Date.now() - startTime.value
    shaderMaterial.value.uniforms.uTime.value = elapsed
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

  // 清理材质
  if (shaderMaterial.value) {
    shaderMaterial.value.dispose()
    shaderMaterial.value = null
  }

  // 移除场景
  if (steamGroup.value && props.scene) {
    props.scene.remove(steamGroup.value)
    steamGroup.value.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
      }
    })
  }

  steamGroup.value = null
  steamMesh.value = null
}

// 监听资源加载完成
watch(() => resources.isLoading.value, (loading) => {
  if (!loading && props.scene) {
    initCoffeeSteam()
  }
}, { immediate: true })

// 监听场景变化
watch(() => props.scene, (newScene) => {
  if (newScene && !resources.isLoading.value) {
    destroy()
    initCoffeeSteam()
  }
})

// 生命周期
onUnmounted(() => {
  destroy()
})

// 暴露方法
defineExpose({
  steamGroup
})
</script>

<style scoped>
.coffee-steam {
  /* Three.js 网格直接添加到场景，无 DOM 元素 */
}
</style>
