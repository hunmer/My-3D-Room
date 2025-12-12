<template>
  <div class="google-leds"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'

// Props
interface Props {
  scene: THREE.Scene | null
  time?: number
  debug?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  time: 0,
  debug: false
})

// Refs
const ledGroup = ref<THREE.Group | null>(null)
const ledItems = ref<Array<{
  index: number
  color: string
  material: THREE.MeshBasicMaterial
  mesh: THREE.Mesh
}>>([])

// 调试相关
const debugFolder = ref<any>(null)
const debugItems = ref<Array<{ color: string }>>([])

// LED 颜色配置
const colors = ['#196aff', '#ff0000', '#ff5d00', '#7db81b']

/**
 * 创建 LED 网格
 */
const createLedMesh = (color: string): THREE.Mesh => {
  // 创建一个简单的立方体作为 LED
  const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)

  const material = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 1
  })

  return new THREE.Mesh(geometry, material)
}

/**
 * 初始化 GoogleLeds
 */
const initGoogleLeds = () => {
  if (!props.scene) return

  // 创建 LED 组
  ledGroup.value = new THREE.Group()
  ledGroup.value.name = 'GoogleLeds'
  props.scene.add(ledGroup.value)

  // 创建 4 个 LED
  for (let i = 0; i < 4; i++) {
    const color = colors[i]
    const mesh = createLedMesh(color)

    // 设置位置（模拟原有布局）
    mesh.position.set(
      (i - 1.5) * 0.3, // 水平分布
      0,
      0
    )

    // 创建材质
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1
    })

    mesh.material = material

    // 添加到场景
    ledGroup.value.add(mesh)

    // 保存 LED 项目
    const ledItem = {
      index: i,
      color: color,
      material: material,
      mesh: mesh
    }

    ledItems.value.push(ledItem)
    debugItems.value.push({ color: color })

    // 设置调试
    if (props.debug) {
      setupDebug(i, ledItem)
    }
  }
}

/**
 * 设置调试功能
 */
const setupDebug = (index: number, item: any) => {
  // 注意：这里需要集成 Tweakpane
  // 目前只是预留接口
  console.log(`LED ${index} 调试功能已设置`)
}

/**
 * 更新动画
 */
const update = (elapsedTime: number) => {
  // 使用正弦波创建闪烁效果
  for (const item of ledItems.value) {
    item.material.opacity =
      Math.sin(elapsedTime * 0.002 - item.index * 0.5) * 0.5 + 0.5
  }
}

/**
 * 销毁 LED
 */
const destroy = () => {
  if (ledGroup.value && props.scene) {
    // 清理网格
    ledGroup.value.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (child.material instanceof THREE.Material) {
          child.material.dispose()
        }
      }
    })

    // 从场景移除
    props.scene.remove(ledGroup.value)
  }

  ledItems.value = []
  ledGroup.value = null
}

// 监听场景变化
watch(() => props.scene, (newScene) => {
  if (newScene) {
    destroy()
    initGoogleLeds()
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  if (props.scene) {
    initGoogleLeds()
  }
})

onUnmounted(() => {
  destroy()
})

// 暴露方法给父组件
defineExpose({
  update,
  ledGroup,
  ledItems
})
</script>

<style scoped>
.google-leds {
  /* 这个组件没有 DOM 元素，Three.js 网格会直接添加到场景中 */
}
</style>
