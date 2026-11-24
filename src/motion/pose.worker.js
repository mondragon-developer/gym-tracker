import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { createPoseWorkerRuntime } from './PoseWorkerRuntime.js';
import { POSE_MODEL_PATH, POSE_WASM_BASE_PATH } from './modelAssets.js';
import { SUBJECT_TRACKER_PROFILE } from './SubjectTracker.js';

const createDetector = async () => {
    if (typeof OffscreenCanvas !== 'function') {
        throw new Error('OffscreenCanvas is required for background pose measurement.');
    }
    // 1.2.3 explicitly supports the module loader through this second argument.
    // Both paths are absolute: the compiled worker itself lives under /assets/.
    const fileset = await FilesetResolver.forVisionTasks(new URL(POSE_WASM_BASE_PATH, self.location.origin).href, true);
    let detector;
    try {
        detector = await PoseLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: new URL(POSE_MODEL_PATH, self.location.origin).href, delegate: 'GPU' },
            canvas: new OffscreenCanvas(1, 1),
            // A second returned body causes abstention. This limit does not prove
            // that every bystander in the scene has been detected.
            runningMode: 'VIDEO', numPoses: SUBJECT_TRACKER_PROFILE.maximumPoses,
            minPoseDetectionConfidence: 0.6,
            minPosePresenceConfidence: 0.6,
            minTrackingConfidence: 0.6,
            outputSegmentationMasks: false,
        });
        // Allocate the inference path during preparation, before admitting camera frames.
        const warmup = new OffscreenCanvas(256, 256);
        const context = warmup.getContext('2d');
        if (!context) throw new Error('The warm-up canvas could not be initialized.');
        context.fillStyle = '#000';
        context.fillRect(0, 0, 256, 256);
        detector.detectForVideo(warmup, 0).close();
        return detector;
    } catch (failure) {
        detector?.close();
        throw failure;
    }
};

const runtime = createPoseWorkerRuntime({ createDetector, postMessage: message => self.postMessage(message) });
self.addEventListener('message', event => { void runtime.handleMessage(event.data); });
