<template>
  <div class="coffee-steam"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { gsap } from '@/core/utils/Animation'
import { ShaderLoader } from '@/core/utils/ShaderLoader'

// Props
interface Props {
  scene: THREE.Scene | null
  debug?: boolean
  position?: { x: number; y: number; z: number }
}

const props = withDefaults(defineProps<Props>(), {
  debug: false,
  position: () => ({ x: 0, y: 0, z: 0 })
})

// Refs
const steamGroup = ref<THREE.Group | null>(null)
const steamMesh = ref<THREE.Mesh | null>(null)
const shaderMaterial = ref<THREE.ShaderMaterial | null>(null)
const steamAnimation = ref<any>(null)

// 时间相关
const elapsedTime = ref(0)
const animationFrame = ref<number | null>(null)

/**
 * 创建蒸汽网格
 */
const createSteamMesh = (): THREE.Mesh => {
  // 创建一个简单的平面作为蒸汽的基础
  const geometry = new THREE.PlaneGeometry(0.5, 1.5, 8, 8)

  // 创建着色器材质
  shaderMaterial.value = ShaderLoader.createCoffeeSteamMaterial()

  return new THREE.Mesh(geometry, shaderMaterial.value)
}

/**
 * 初始化咖啡蒸汽
 */
const initCoffeeSteam = () => {
  if (!props.scene) return

  // 创建蒸汽组
  steamGroup.value = new THREE.Group()
  steamGroup.value.name = 'CoffeeSteam'
  steamGroup.value.position.set(props.position.x, props.position.y, props.position.z)
  props.scene.add(steamGroup.value)

  // 创建蒸汽网格
  steamMesh.value = createSteamMesh()
  steamGroup.value.add(steamMesh.value)

  // 使用 GSAP 动画化着色器 uniform
  if (shaderMaterial.value) {
    steamAnimation.value = gsap.to(shaderMaterial.value.uniforms.uTime, {
      value: 1000,
      duration: 5,
      repeat: -1,
      ease: 'none'
    })

    // 动画化颜色
    const colors = ['#ffffff', '#f0f0f0', '#e0e0e0', '#ffffff']
    gsap.to(shaderMaterial.value.uniforms.uColor.value, {
      r: 0.9,
      g: 0.9,
      b: 0.9,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut'
    })

    // 动画化频率
    gsap.to(shaderMaterial.value.uniforms.uTimeFrequency, {
      value: 0.002,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })
  }
}

/**
 * 更新蒸汽动画
 */
const update = (time: number) => {
  elapsedTime.value = time

  // GSAP 已经处理了动画，这里可以添加额外的逻辑
  if (steamGroup.value && shaderMaterial.value) {
    // 可以根据时间调整蒸汽的强度
    const intensity = 0.5 + Math.sin(time * 0.001) * 0.3
    shaderMaterial.value.uniforms.uTime.value = time * 0.001

    // 动态调整颜色强度
    if (shaderMaterial.value.uniforms.uColor) {
      const color = shaderMaterial.value.uniforms.uColor.value
      color.multiplyScalar(intensity)
    }
  }
}

/**
 * 销毁蒸汽
 */
const destroy = () => {
  // 清理 GSAP 动画
  if (steamAnimation.value) {
    steamAnimation.value.kill()
  }

  if (steamGroup.value && props.scene) {
    // 清理网格
    if (steamMesh.value) {
      steamMesh.value.geometry.dispose()
      if (shaderMaterial.value) {
        shaderMaterial.value.dispose()
      }
    }

    // 从场景移除
    props.scene.remove(steamGroup.value)
  }

  steamGroup.value = null
  steamMesh.value = null
  shaderMaterial.value = null
}

// 监听场景变化
watch(() => props.scene, (newScene) => {
  if (newScene) {
    destroy()
    initCoffeeSteam()
  }
}, { immediate: true })

// 监听位置变化
watch(() => props.position, (newPosition) => {
  if (steamGroup.value) {
    steamGroup.value.position.set(newPosition.x, newPosition.y, newPosition.z)
  }
})

// 生命周期
onMounted(() => {
  if (props.scene) {
    initCoffeeSteam()
  }
})

onUnmounted(() => {
  destroy()
})

// 暴露方法给父组件
defineExpose({
  update,
  steamGroup,
  steamMesh,
  shaderMaterial
})
</script>

<style scoped>
.coffee-steam {
  /* 这个组件没有 DOM 元素，Three.js 网格会直接添加到场景中 */
}
</style>
