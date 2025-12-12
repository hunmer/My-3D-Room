<template>
  <div class="cat"></div>
</template>

<script setup lang="ts">
import { shallowRef, ref, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { getResources } from '@/composables/useResources'
import { getInteraction } from '@/composables/useInteraction'

// Props
interface Props {
  scene: THREE.Scene | null
  position?: { x: number; y: number; z: number }
  targetSize?: number // 目标尺寸（模型最大边的长度）
  rotation?: { x: number; y: number; z: number }
}

const props = withDefaults(defineProps<Props>(), {
  position: () => ({ x: 0, y: 0, z: 0 }),
  targetSize: 0.6, // 默认目标尺寸（房间约 10 单位，猫约 6%）
  rotation: () => ({ x: 0, y: 0, z: 0 })
})

// 模型原始信息
const originalSize = ref<THREE.Vector3 | null>(null)
const calculatedScale = ref(1)

// Emits
const emit = defineEmits<{
  click: [object: THREE.Object3D, event: MouseEvent]
}>()

// 资源管理器
const resources = getResources()

// 交互系统
const interaction = getInteraction()

// Three.js 对象（使用 shallowRef 避免 Proxy 冲突）
const catModel = shallowRef<THREE.Group | null>(null)

// 取消注册函数
const unregisterInteraction = shallowRef<(() => void) | null>(null)

/**
 * 调试：打印模型层次结构
 */
const debugModelHierarchy = (model: THREE.Object3D, depth = 0) => {
  const indent = '  '.repeat(depth)
  const type = model.type
  const name = model.name || '(unnamed)'

  // 获取世界变换
  const worldPos = new THREE.Vector3()
  const worldScale = new THREE.Vector3()
  const worldQuat = new THREE.Quaternion()
  model.getWorldPosition(worldPos)
  model.getWorldScale(worldScale)
  model.getWorldQuaternion(worldQuat)

  console.log(`${indent}📦 ${name} [${type}]`)
  // 只对前两层输出变换信息
  if (depth <= 1) {
    console.log(`${indent}   Local: pos(${model.position.x.toFixed(2)}, ${model.position.y.toFixed(2)}, ${model.position.z.toFixed(2)}) scale(${model.scale.x.toFixed(4)}, ${model.scale.y.toFixed(4)}, ${model.scale.z.toFixed(4)})`)
    console.log(`${indent}   World: pos(${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}, ${worldPos.z.toFixed(2)}) scale(${worldScale.x.toFixed(4)}, ${worldScale.y.toFixed(4)}, ${worldScale.z.toFixed(4)})`)
  }

  if (model instanceof THREE.Mesh || model instanceof THREE.SkinnedMesh) {
    const box = new THREE.Box3().setFromObject(model)
    const size = new THREE.Vector3()
    box.getSize(size)
    console.log(`${indent}   BBox Size: (${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)})`)

    if (model instanceof THREE.SkinnedMesh) {
      console.log(`${indent}   ⚠️ SkinnedMesh detected!`)
      console.log(`${indent}   skeleton:`, model.skeleton ? 'yes' : 'no')
      if (model.skeleton) {
        console.log(`${indent}   Bones count: ${model.skeleton.bones.length}`)
        console.log(`${indent}   Skeleton root:`, model.skeleton.bones[0]?.name)
        console.log(`${indent}   bindMode:`, model.bindMode)
        console.log(`${indent}   bindMatrix:`, model.bindMatrix.elements.slice(0, 4).map(v => v.toFixed(2)).join(', '), '...')
      }
    }
  }

  model.children.forEach(child => debugModelHierarchy(child, depth + 1))
}

/**
 * 计算模型边界框并返回尺寸
 */
const calculateModelSize = (model: THREE.Object3D): THREE.Vector3 => {
  const box = new THREE.Box3().setFromObject(model)
  const size = new THREE.Vector3()
  box.getSize(size)
  return size
}

/**
 * 根据目标尺寸计算缩放比例
 */
const calculateScaleForTargetSize = (modelSize: THREE.Vector3, targetSize: number): number => {
  // 获取模型最大边
  const maxDimension = Math.max(modelSize.x, modelSize.y, modelSize.z)
  if (maxDimension === 0) return 1
  return targetSize / maxDimension
}

/**
 * 初始化猫模型
 */
const initCat = () => {
  if (!props.scene) return

  // 获取 FBX 模型
  const fbxGroup = resources.getFBX('catModel')

  if (!fbxGroup) {
    console.warn('Cat model not loaded')
    return
  }

  // 直接使用原始模型（不克隆，因为带骨骼的模型克隆需要特殊处理）
  catModel.value = fbxGroup

  // 修复 FBX 导出时的 100x 缩放问题
  catModel.value.traverse((child) => {
    // 重置所有 100x 缩放的对象（使用宽松比较）
    if (Math.abs(child.scale.x - 100) < 1 && Math.abs(child.scale.y - 100) < 1 && Math.abs(child.scale.z - 100) < 1) {
      console.log(`🐱 Fixing ${child.name || child.type} scale: ${child.scale.x.toFixed(1)} -> 1`)
      child.scale.set(1, 1, 1)
    }

    // 修复 SkinnedMesh 的 bindMatrix（包含了 100x 缩放）
    if (child instanceof THREE.SkinnedMesh && child.skeleton) {
      const bindMatrix = child.bindMatrix
      // 检查 bindMatrix 是否包含 100x 缩放（矩阵对角线元素）
      if (Math.abs(bindMatrix.elements[0] - 100) < 1) {
        console.log(`🐱 Fixing ${child.name} bindMatrix: removing 100x scale`)
        // 创建新的单位 bindMatrix
        const newBindMatrix = new THREE.Matrix4()
        child.bind(child.skeleton, newBindMatrix)
      }
    }
  })

  // 先更新世界矩阵
  catModel.value.updateMatrixWorld(true)

  // 检查 SkinnedMesh 的 skeleton 引用
  const model = catModel.value // 保存引用避免类型检查问题
  model.traverse((child) => {
    if (child instanceof THREE.SkinnedMesh && child.skeleton) {
      const skeleton = child.skeleton
      const rootBone = skeleton.bones[0]

      // 检查骨骼是否在当前模型树中
      let boneInTree = false
      model.traverse((node) => {
        if (node === rootBone) boneInTree = true
      })

      console.log(`🐱 SkinnedMesh ${child.name}:`)
      console.log(`   skeleton.bones[0]: ${rootBone?.name}`)
      console.log(`   bone in model tree: ${boneInTree}`)
      console.log(`   bone parent: ${rootBone?.parent?.name || '(none)'}`)

      skeleton.calculateInverses()
      console.log(`   Recalculated skeleton inverses`)
    }
  })

  // 调试：打印完整模型层次结构
  console.log('🐱 ===== Cat Model Hierarchy =====')
  debugModelHierarchy(catModel.value)
  console.log('🐱 ================================')

  // 计算原始模型尺寸（在缩放之前）
  originalSize.value = calculateModelSize(catModel.value)

  // 根据目标尺寸计算缩放比例
  calculatedScale.value = calculateScaleForTargetSize(originalSize.value, props.targetSize)

  // 输出模型信息到控制台
  console.log('🐱 Cat Model Info:')
  console.log('  Original Size:', {
    x: originalSize.value.x.toFixed(2),
    y: originalSize.value.y.toFixed(2),
    z: originalSize.value.z.toFixed(2)
  })
  console.log('  Target Size:', props.targetSize)
  console.log('  Calculated Scale:', calculatedScale.value.toFixed(6))

  // 获取纹理
  const catTexture = resources.getTexture('catTexture')
  const eyeTexture = resources.getTexture('catEyeTexture')

  // 应用纹理材质
  catModel.value.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const meshName = child.name.toLowerCase()

      // 根据网格名称应用不同纹理
      if (meshName.includes('eye')) {
        if (eyeTexture) {
          child.material = new THREE.MeshStandardMaterial({
            map: eyeTexture,
            roughness: 0.3,
            metalness: 0.1
          })
        }
      } else if (catTexture) {
        child.material = new THREE.MeshStandardMaterial({
          map: catTexture,
          roughness: 0.8,
          metalness: 0.0
        })
      }

      // 启用阴影
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  // 设置位置、缩放和旋转
  catModel.value.position.set(props.position.x, props.position.y, props.position.z)
  catModel.value.scale.setScalar(calculatedScale.value)
  catModel.value.rotation.set(props.rotation.x, props.rotation.y, props.rotation.z)

  // 添加到场景
  props.scene.add(catModel.value)

  // 注册点击交互
  unregisterInteraction.value = interaction.registerGroup(catModel.value, {
    name: 'Cat',
    bounceScale: 1.05,
    bounceDuration: 0.2,
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

  // 移除场景并清理材质
  if (catModel.value && props.scene) {
    props.scene.remove(catModel.value)

    // 清理材质和几何体
    catModel.value.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose()
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose())
          } else {
            child.material.dispose()
          }
        }
      }
    })
  }

  catModel.value = null
}

// 监听资源加载完成
watch(
  () => resources.isLoading.value,
  (loading) => {
    if (!loading && props.scene) {
      initCat()
    }
  },
  { immediate: true }
)

// 监听场景变化
watch(
  () => props.scene,
  (newScene) => {
    if (newScene && !resources.isLoading.value) {
      destroy()
      initCat()
    }
  }
)

// 监听位置变化
watch(
  () => props.position,
  (newPos) => {
    if (catModel.value) {
      catModel.value.position.set(newPos.x, newPos.y, newPos.z)
    }
  },
  { deep: true }
)

// 监听目标尺寸变化
watch(
  () => props.targetSize,
  (newTargetSize) => {
    if (catModel.value && originalSize.value) {
      calculatedScale.value = calculateScaleForTargetSize(originalSize.value, newTargetSize)
      catModel.value.scale.setScalar(calculatedScale.value)
      console.log('🐱 Cat Scale Updated:', calculatedScale.value.toFixed(6), 'for target size:', newTargetSize)
    }
  }
)

// 监听旋转变化
watch(
  () => props.rotation,
  (newRot) => {
    if (catModel.value) {
      catModel.value.rotation.set(newRot.x, newRot.y, newRot.z)
    }
  },
  { deep: true }
)

// 生命周期
onUnmounted(() => {
  destroy()
})

// 暴露方法和属性
defineExpose({
  catModel,
  originalSize,
  calculatedScale
})
</script>

<style scoped>
.cat {
  /* Three.js 网格直接添加到场景，无 DOM 元素 */
}
</style>
