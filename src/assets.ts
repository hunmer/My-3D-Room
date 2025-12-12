/**
 * 资源配置文件
 * 定义项目中使用的所有 3D 模型、纹理和视频资源
 */

export interface AssetItem {
  name: string
  source: string
  type: 'texture' | 'model' | 'video'
}

export interface AssetGroup {
  name: string
  data: Record<string, any>
  items: AssetItem[]
}

const assets: AssetGroup[] = [
  {
    name: 'base',
    data: {},
    items: [
      { name: 'googleHomeLedMaskTexture', source: '/assets/googleHomeLedMask.png', type: 'texture' },
      { name: 'googleHomeLedsModel', source: '/assets/googleHomeLedsModel.glb', type: 'model' },

      { name: 'loupedeckButtonsModel', source: '/assets/loupedeckButtonsModel.glb', type: 'model' },

      { name: 'topChairModel', source: '/assets/topChairModel.glb', type: 'model' },

      { name: 'coffeeSteamModel', source: '/assets/coffeeSteamModel.glb', type: 'model' },

      { name: 'elgatoLightModel', source: '/assets/elgatoLightModel.glb', type: 'model' },

      { name: 'threejsJourneyLogoTexture', source: '/assets/HoussemLachtarLogo.png', type: 'texture' },

      { name: 'pcScreenModel', source: '/assets/pcScreenModel.glb', type: 'model' },

      { name: 'macScreenModel', source: '/assets/macScreenModel.glb', type: 'model' },

      { name: 'bakedDayTexture', source: '/assets/bakedDay.jpg', type: 'texture' },
      { name: 'bakedNightTexture', source: '/assets/bakedNight.jpg', type: 'texture' },
      { name: 'bakedNeutralTexture', source: '/assets/bakedNeutral.jpg', type: 'texture' },
      { name: 'lightMapTexture', source: '/assets/lightMap.jpg', type: 'texture' },
      { name: 'roomModel', source: '/assets/roomModel.glb', type: 'model' },

      // 视频资源
      { name: 'pcScreenVideo', source: '/assets/videoStream.mp4', type: 'video' },
      { name: 'macScreenVideo', source: '/assets/videoPortfolio.mp4', type: 'video' },
    ]
  }
]

export default assets
