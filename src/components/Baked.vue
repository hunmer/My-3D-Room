<template>
  <div class="baked-room"></div>
</template>

<script setup lang="ts">
import { shallowRef, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { getResources } from '@/composables/useResources'

// 导入着色器
import vertexShader from '@/shaders/baked/vertex.glsl'
import fragmentShader from '@/shaders/baked/fragment.glsl'

// Props
interface Props {
  scene: THREE.Scene | null
  nightMix?: number
  neutralMix?: number
  tvColor?: string
  tvStrength?: number
  deskColor?: string
  deskStrength?: number
  pcColor?: string
  pcStrength?: number
}

const props = withDefaults(defineProps<Props>(), {
  nightMix: 0,
  neutralMix: 0,
  tvColor: '#ff115e',
  tvStrength: 1.47,
  deskColor: '#ff6700',
  deskStrength: 1.9,
  pcColor: '#0082ff',
  pcStrength: 1.4
})

// 资源管理器
const resources = getResources()

// Three.js 对象（使用 shallowRef 避免 Proxy 冲突）
const roomGroup = shallowRef<THREE.Group | null>(null)
const bakedMaterial = shallowRef<THREE.ShaderMaterial | null>(null)

/**
 * 初始化房间
 */
const initBaked = () => {
  if (!props.scene) return

  // 获取模型
  const roomGltf = resources.getModel('roomModel')
  if (!roomGltf) {
    console.warn('Room model not loaded')
    return
  }

  // 获取纹理
  const bakedDayTexture = resources.getTexture('bakedDayTexture')
  const bakedNightTexture = resources.getTexture('bakedNightTexture')
  const bakedNeutralTexture = resources.getTexture('bakedNeutralTexture')
  const lightMapTexture = resources.getTexture('lightMapTexture')

  if (!bakedDayTexture || !bakedNightTexture || !bakedNeutralTexture || !lightMapTexture) {
    console.warn('Baked textures not loaded')
    return
  }

  // 设置纹理属性
  bakedDayTexture.flipY = false
  bakedDayTexture.colorSpace = THREE.SRGBColorSpace
  bakedNightTexture.flipY = false
  bakedNightTexture.colorSpace = THREE.SRGBColorSpace
  bakedNeutralTexture.flipY = false
  bakedNeutralTexture.colorSpace = THREE.SRGBColorSpace
  lightMapTexture.flipY = false

  // 创建着色器材质
  bakedMaterial.value = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uBakedDayTexture: { value: bakedDayTexture },
      uBakedNightTexture: { value: bakedNightTexture },
      uBakedNeutralTexture: { value: bakedNeutralTexture },
      uLightMapTexture: { value: lightMapTexture },
      uNightMix: { value: props.nightMix },
      uNeutralMix: { value: props.neutralMix },
      uLightTvColor: { value: new THREE.Color(props.tvColor) },
      uLightTvStrength: { value: props.tvStrength },
      uLightDeskColor: { value: new THREE.Color(props.deskColor) },
      uLightDeskStrength: { value: props.deskStrength },
      uLightPcColor: { value: new THREE.Color(props.pcColor) },
      uLightPcStrength: { value: props.pcStrength }
    }
  })

  // 创建房间组
  roomGroup.value = new THREE.Group()
  roomGroup.value.name = 'BakedRoom'

  // 获取房间网格
  const roomMesh = roomGltf.scene.children[0]

  // 遍历模型并应用材质
  roomMesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = bakedMaterial.value
    }
  })

  // 添加模型到组
  roomGroup.value.add(roomMesh)

  // 添加到场景
  props.scene.add(roomGroup.value)
}

/**
 * 更新 uniform
 */
const updateUniforms = () => {
  if (!bakedMaterial.value) return

  bakedMaterial.value.uniforms.uNightMix.value = props.nightMix
  bakedMaterial.value.uniforms.uNeutralMix.value = props.neutralMix
  bakedMaterial.value.uniforms.uLightTvColor.value.set(props.tvColor)
  bakedMaterial.value.uniforms.uLightTvStrength.value = props.tvStrength
  bakedMaterial.value.uniforms.uLightDeskColor.value.set(props.deskColor)
  bakedMaterial.value.uniforms.uLightDeskStrength.value = props.deskStrength
  bakedMaterial.value.uniforms.uLightPcColor.value.set(props.pcColor)
  bakedMaterial.value.uniforms.uLightPcStrength.value = props.pcStrength
}

/**
 * 销毁
 */
const destroy = () => {
  if (bakedMaterial.value) {
    bakedMaterial.value.dispose()
    bakedMaterial.value = null
  }

  if (roomGroup.value && props.scene) {
    props.scene.remove(roomGroup.value)
    roomGroup.value.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
      }
    })
  }

  roomGroup.value = null
}

// 监听资源加载完成
watch(() => resources.isLoading.value, (loading) => {
  if (!loading && props.scene) {
    initBaked()
  }
}, { immediate: true })

// 监听场景变化
watch(() => props.scene, (newScene) => {
  if (newScene && !resources.isLoading.value) {
    destroy()
    initBaked()
  }
})

// 监听所有 props 变化
watch(() => [
  props.nightMix,
  props.neutralMix,
  props.tvColor,
  props.tvStrength,
  props.deskColor,
  props.deskStrength,
  props.pcColor,
  props.pcStrength
], () => {
  updateUniforms()
})

// 生命周期
onUnmounted(() => {
  destroy()
})

// 暴露材质供其他组件使用
defineExpose({
  roomGroup,
  bakedMaterial
})
</script>

<style scoped>
.baked-room {
  /* Three.js 网格直接添加到场景，无 DOM 元素 */
}
</style>
