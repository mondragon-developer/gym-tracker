const freeze = (value) => {
    Object.values(value).forEach(item => {
        if (item && typeof item === 'object') freeze(item);
    });
    return Object.freeze(value);
};

/**
 * Experimental movement-detection parameters, not anatomical correctness limits.
 * This profile supports explicitly confirmed side-view bodyweight squats only.
 * Every threshold requires validation on independent recordings and devices.
 */
export const SQUAT_SIDE_PROFILE = freeze({
    id: 'bodyweight-squat-side',
    version: '0.3.0-experimental',
    scope: 'measurement-only',
    validationStatus: 'not-validated',
    cameraView: 'side',
    landmarks: {
        left: { shoulder: 11, hip: 23, knee: 25, ankle: 27, heel: 29, toe: 31 },
        right: { shoulder: 12, hip: 24, knee: 26, ankle: 28, heel: 30, toe: 32 },
    },
    capture: {
        minimumVisibility: 0.6,
        minimumPresence: 0.5,
        frameMargin: 0.015,
        minimumSegmentLength: 0.045,
        minimumTorsoLength: 0.07,
        minimumFootLength: 0.015,
        maximumBilateralWidthToTorso: 0.55,
        maximumScaleChangeRatio: 0.25,
        maximumAnkleDriftLegRatio: 0.18,
        maximumAspectRatioChange: 0.02,
        maximumObservationGapMs: 350,
    },
    calibration: {
        durationMs: 600,
        minimumSamples: 6,
        minimumStandingKneeAngle: 155,
        maximumKneeRangeDegrees: 6,
        maximumHipRange: 0.025,
    },
    detector: {
        startDropDegrees: 5,
        confirmDescentDropDegrees: 15,
        returnDropDegrees: 7,
        minimumCycleDropDegrees: 50,
        minimumHipDescentLegRatio: 0.12,
        minimumStartHipDescentLegRatio: 0.015,
        bottomBandDegrees: 1,
        ascentRiseDegrees: 8,
        maximumAscentReversalDegrees: 12,
        phaseEvidenceMs: 100,
        standingEvidenceMs: 150,
        minimumPhaseMs: 150,
        // Supported start-duration budget, not a movement-correctness limit.
        maximumPendingStartMs: 5000,
        maximumCycleMs: 45000,
    },
    unavailableCriteria: [
        { id: 'stance_width', reason: 'Bilateral stance width is not evaluated from this side-view profile.' },
        { id: 'frontal_knee_tracking', reason: 'Frontal knee tracking requires a separately validated view and evaluator.' },
        { id: 'spinal_curvature', reason: 'Shoulder and hip landmarks do not measure segmental spinal curvature.' },
        { id: 'knee_over_toe_correctness', reason: 'Knee travel beyond the toes is not classified as a universal fault.' },
        { id: 'depth_correctness', reason: 'Detector excursion thresholds do not establish appropriate squat depth.' },
        { id: 'bracing_pressure_pain', reason: 'Bracing, foot pressure, joint loading, and pain are not measured.' },
        { id: 'overall_technique', reason: 'This experimental profile does not produce a technique or safety score.' },
    ],
    evidence: [
        'https://pubmed.ncbi.nlm.nih.gov/14636100/',
        'https://link.springer.com/article/10.1186/s13102-018-0103-7',
        'https://developers.google.com/ml-kit/vision/pose-detection/classifying-poses',
        'https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker',
    ],
});
