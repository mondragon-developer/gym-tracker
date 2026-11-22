/** Versioned, self-hosted artifacts. These URLs must match the build asset copy step. */
export const POSE_RUNTIME_VERSION = '1.2.3';
export const POSE_MODEL_VERSION = 'pose-landmarker-lite-float16-1';
export const POSE_WASM_BASE_PATH = `/motion-assets/tasks-vision/${POSE_RUNTIME_VERSION}`;
export const POSE_MODEL_PATH = '/motion-assets/pose-landmarker-lite/float16/1/pose_landmarker_lite.task';

// The model is published by Google. Downloads occur during the asset preparation
// step; camera frames and motion results never use this origin.
export const POSE_MODEL_SOURCE_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
export const POSE_MODEL_BYTES = 5777746;

export const POSE_WASM_FILES = Object.freeze([
    'vision_wasm_module_internal.js',
    'vision_wasm_module_internal.wasm',
]);
