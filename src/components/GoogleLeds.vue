<template>
  <div class="google-leds"></div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { gsap } from '@/core/utils/Animation'
import { Pane } from 'tweakpane'

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

// Refs（Three.js 对象使用 shallowRef 避免 Proxy 冲突）
const ledGroup = shallowRef<THREE.Group | null>(null)
const ledItems = ref<Array<{
  index: number
  color: string
  material: THREE.MeshBasicMaterial
  mesh: THREE.Mesh
  animation?: any
}>>([])

// GSAP 动画实例
const animationInstance = ref<any>(null)

// 调试相关（Pane 也使用 shallowRef）
const debugPane = shallowRef<Pane | null>(null)
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

  // 创建调试面板
  if (props.debug) {
    debugPane.value = new Pane({
      title: 'Google Leds',
      width: 300
    })
  }

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

    // 使用 GSAP 创建闪烁动画
    const animation = gsap.to(material, {
      opacity: () => 0.3 + Math.random() * 0.7,
      duration: 1.5 + Math.random() * 0.5,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
      delay: i * 0.2
    })

    ;(ledItem as any).animation = animation

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
  if (!props.debug || !debugPane.value) return

  // 创建文件夹
  const folder = debugPane.value.addFolder({
    title: `LED ${index}`,
    expanded: false
  })

  // 添加颜色控制（Tweakpane v3 使用 addInput）
  folder.addInput(item, 'color', {
    label: 'Color',
    view: 'color'
  }).on('change', (ev: any) => {
    item.material.color.set(ev.value)
  })

  // 添加不透明度控制
  folder.addInput(item.material, 'opacity', {
    label: 'Opacity',
    min: 0,
    max: 1,
    step: 0.01
  })

  // 添加动画速度控制（GSAP timeScale 是方法，需要代理对象）
  const speedProxy = { speed: 1 }
  folder.addInput(speedProxy, 'speed', {
    label: 'Speed',
    min: 0,
    max: 2,
    step: 0.1
  }).on('change', (ev: any) => {
    if (item.animation) {
      item.animation.timeScale(ev.value)
    }
  })
}

/**
 * 更新动画（现在由 GSAP 管理，这里可以添加额外的更新逻辑）
 */
const update = (elapsedTime: number) => {
  // GSAP 已经管理动画，这里可以添加额外的逻辑
  // 例如：根据时间调整动画速度
  for (const item of ledItems.value) {
    if (item.animation) {
      // 可以动态调整动画参数
      // item.animation.timeScale(1 + Math.sin(elapsedTime * 0.001) * 0.5)
    }
  }
}

/**
 * 销毁 LED
 */
const destroy = () => {
  // 清理 GSAP 动画
  for (const item of ledItems.value) {
    if (item.animation) {
      item.animation.kill()
    }
  }

  // 清理调试面板
  if (debugPane.value) {
    debugPane.value.dispose()
    debugPane.value = null
  }

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
