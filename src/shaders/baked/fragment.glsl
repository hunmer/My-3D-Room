uniform sampler2D uBakedDayTexture;
uniform sampler2D uBakedNightTexture;
uniform sampler2D uBakedNeutralTexture;
uniform sampler2D uLightMapTexture;

uniform float uNightMix;
uniform float uNeutralMix;

uniform vec3 uLightTvColor;
uniform float uLightTvStrength;

uniform vec3 uLightDeskColor;
uniform float uLightDeskStrength;

uniform vec3 uLightPcColor;
uniform float uLightPcStrength;

varying vec2 vUv;

// Lighten blend mode: 取两个颜色中较亮的值
vec3 blendLighten(vec3 base, vec3 blend, float opacity) {
    return mix(base, max(base, blend), opacity);
}

void main()
{
    // 采样烘焙纹理
    vec3 bakedDayColor = texture2D(uBakedDayTexture, vUv).rgb;
    vec3 bakedNightColor = texture2D(uBakedNightTexture, vUv).rgb;
    vec3 bakedNeutralColor = texture2D(uBakedNeutralTexture, vUv).rgb;

    // 混合日/夜/中性纹理
    vec3 bakedColor = mix(mix(bakedDayColor, bakedNightColor, uNightMix), bakedNeutralColor, uNeutralMix);

    // 采样灯光贴图 (R=电视, G=桌面, B=PC)
    vec3 lightMapColor = texture2D(uLightMapTexture, vUv).rgb;

    // 电视灯光 (红色通道)
    float lightTvStrength = lightMapColor.r * uLightTvStrength;
    bakedColor = blendLighten(bakedColor, uLightTvColor, lightTvStrength);

    // PC 灯光 (蓝色通道)
    float lightPcStrength = lightMapColor.b * uLightPcStrength;
    bakedColor = blendLighten(bakedColor, uLightPcColor, lightPcStrength);

    // 桌面灯光 (绿色通道)
    float lightDeskStrength = lightMapColor.g * uLightDeskStrength;
    bakedColor = blendLighten(bakedColor, uLightDeskColor, lightDeskStrength);

    gl_FragColor = vec4(bakedColor, 1.0);
}
