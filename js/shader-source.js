export const DITHER_GLSL = `
if (dMode > 0) {
    bool isDither = false;
    vec2 scaledUv = myUv * (100.0 / dSpace);
    float lineThreshold = dThick / dSpace;
    if (dMode == 1) {
        vec2 gridUv = floor(scaledUv);
        float noise = fract(sin(dot(gridUv, vec2(12.9898,78.233)))*43758.5453);
        isDither = noise > 0.5;
    } else if (dMode == 2) {
        isDither = fract(scaledUv.y) < lineThreshold;
    } else if (dMode == 3) {
        isDither = fract(scaledUv.x) < lineThreshold;
    } else if (dMode == 4) {
        isDither = (fract(scaledUv.y) < lineThreshold) || (fract(scaledUv.x) < lineThreshold);
    }
    if (isDither) {
        vec3 targetCol;
        if (dInkMode == 1) {
            float baseLum = dot(splitBase, vec3(0.299,0.587,0.114));
            float fragLum = dot(gl_FragColor.rgb, vec3(0.299,0.587,0.114));
            float lightingScale = fragLum / max(baseLum, 0.001);
            targetCol = dInkColor * lightingScale;
        } else {
            vec3 brightShift = dBright > 0.0 ? vec3(1.0) : vec3(0.0);
            targetCol = mix(gl_FragColor.rgb, brightShift, abs(dBright));
        }
        gl_FragColor.rgb = mix(gl_FragColor.rgb, targetCol, dAlpha);
    }
}
`;
