/**
 * Provisional short-term geometry checks for an explicitly confirmed subject.
 * This is not biometric identification. Two similar people can still be confused;
 * a detector returning one pose does not establish that no bystander is present.
 */
export const SUBJECT_TRACKER_PROFILE = Object.freeze({
    version: '0.2.0-experimental',
    maximumPoses: 2,
    minimumVisibility: 0.6,
    minimumPresence: 0.5,
    frameMargin: 0.015,
    minimumSegmentLength: 0.045,
    minimumTorsoLength: 0.07,
    minimumFootLength: 0.015,
    // Provisional startup parameters, not independently validated accuracy criteria.
    minimumCandidateDurationMs: 300,
    minimumCandidateObservations: 6,
    maximumObservationGapMs: 350,
    maximumAspectRatioChange: 0.02,
    maximumScaleChangeRatio: 0.3,
    maximumHipDisplacementLegRatio: 0.4,
    maximumAnkleDisplacementLegRatio: 0.18,
});

const profile = SUBJECT_TRACKER_PROFILE;
const sides = { left: [11, 23, 25, 27, 29, 31], right: [12, 24, 26, 28, 30, 32] };
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pointVisible = point => point && Number.isFinite(point.x) && Number.isFinite(point.y)
    && Number.isFinite(point.visibility) && point.visibility >= profile.minimumVisibility
    && (point.presence == null || (Number.isFinite(point.presence) && point.presence >= profile.minimumPresence));

const describeCandidate = (landmarks, ratio, preferredSide) => {
    if (!Array.isArray(landmarks) || landmarks.length !== 33
        || landmarks.some(point => !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)
            || (point.z != null && !Number.isFinite(point.z)))) return null;
    const projected = index => ({ x: landmarks[index].x * ratio, y: landmarks[index].y });
    const candidates = Object.entries(sides).map(([side, indices]) => {
        const required = indices.map(index => landmarks[index]);
        if (required.some(point => !pointVisible(point) || point.x < profile.frameMargin
            || point.x > 1 - profile.frameMargin || point.y < profile.frameMargin
            || point.y > 1 - profile.frameMargin)) return null;
        const [shoulder, hip, knee, ankle, heel, toe] = indices.map(projected);
        const thigh = distance(hip, knee), shin = distance(knee, ankle);
        const torso = distance(shoulder, hip);
        if (Math.min(thigh, shin) < profile.minimumSegmentLength || torso < profile.minimumTorsoLength
            || distance(heel, toe) < profile.minimumFootLength) return null;
        return { side, hip, ankle, torso, legLength: thigh + shin, ratio,
            visibility: Math.min(...required.map(point => point.visibility)) };
    }).filter(Boolean);
    const candidate = candidates.find(item => item.side === preferredSide)
        ?? candidates.sort((a, b) => b.visibility - a.visibility)[0];
    if (!candidate) return null;
    const points = [...new Set(Object.values(sides).flat())].map(index => landmarks[index]).filter(pointVisible);
    const left = Math.max(0, Math.min(...points.map(point => point.x)));
    const right = Math.min(1, Math.max(...points.map(point => point.x)));
    const top = Math.max(0, Math.min(...points.map(point => point.y)));
    const bottom = Math.min(1, Math.max(...points.map(point => point.y)));
    if (right <= left || bottom <= top) return null;
    return { ...candidate, bounds: { x: left, y: top, width: right - left, height: bottom - top } };
};

const continuous = (previous, candidate) => Math.abs(candidate.ratio / previous.ratio - 1) <= profile.maximumAspectRatioChange
    && Math.abs(candidate.legLength / previous.legLength - 1) <= profile.maximumScaleChangeRatio
    && Math.abs(candidate.torso / previous.torso - 1) <= profile.maximumScaleChangeRatio
    && distance(candidate.hip, previous.hip) / previous.legLength <= profile.maximumHipDisplacementLegRatio
    && distance(candidate.ankle, previous.ankle) / previous.legLength <= profile.maximumAnkleDisplacementLegRatio;

/**
 * One candidate, a qualification start time, a capped observation count, and one
 * confirmation token are retained. After a confirmed target becomes uncertain,
 * this segment is terminal: a new worker/session is required. Tokens are
 * session-scoped continuity tokens, not person identifiers.
 */
export function createSubjectTracker() {
    let candidate = null, token = null, nextToken = 0, lastTimestamp = null;
    let candidateStartedAt = null, candidateObservations = 0;
    let confirmed = false, restartRequired = false, reason = 'subject_missing', observedPoses = 0;
    let admittedFrames = 0, ambiguousFrames = 0, unavailableFrames = 0, interruptions = 0;
    const getSnapshot = () => ({
        version: profile.version,
        status: restartRequired ? 'confirmation_required' : confirmed ? 'tracking'
            : token ? 'awaiting_confirmation' : 'unavailable',
        reason: confirmed && !restartRequired ? null : token && !restartRequired ? 'confirm_subject' : reason,
        confirmationToken: !confirmed && !restartRequired ? token : null,
        bounds: candidate ? { ...candidate.bounds } : null,
        observedPoses, restartRequired,
    });
    const interrupt = interruptionReason => {
        if (confirmed && !restartRequired) { interruptions += 1; restartRequired = true; }
        candidate = null; token = null; reason = interruptionReason;
        candidateStartedAt = null; candidateObservations = 0;
        return getSnapshot();
    };
    const update = ({ poses, timestampMs, imageWidth, imageHeight }) => {
        admittedFrames += 1;
        if (restartRequired) return { subject: getSnapshot(), landmarks: [], trackingLost: false };
        observedPoses = Array.isArray(poses) ? poses.length : 0;
        const wasTracking = confirmed;
        let issue = null;
        if (!Number.isFinite(timestampMs) || timestampMs < 0
            || (lastTimestamp != null && timestampMs <= lastTimestamp)) issue = 'invalid_timestamp';
        else if (lastTimestamp != null && timestampMs - lastTimestamp > profile.maximumObservationGapMs) issue = 'observation_gap';
        if (Number.isFinite(timestampMs) && timestampMs >= 0 && (lastTimestamp == null || timestampMs > lastTimestamp)) {
            lastTimestamp = timestampMs;
        }
        if (observedPoses > 1) { ambiguousFrames += 1; issue ??= 'multiple_people'; }
        else if (!observedPoses) issue ??= 'subject_missing';
        if (!Number.isFinite(imageWidth) || !Number.isFinite(imageHeight) || imageWidth <= 0 || imageHeight <= 0) {
            issue ??= 'invalid_geometry';
        }
        const next = !issue ? describeCandidate(poses[0], imageWidth / imageHeight, candidate?.side) : null;
        if (!issue && !next) issue = 'required_landmarks_unavailable';
        if (!issue && candidate && !continuous(candidate, next)) issue = 'subject_changed';
        if (issue) {
            unavailableFrames += 1;
            interrupt(issue);
            // Before selection, qualification restarts on the following frame;
            // a command based on an old preview can never confirm a new candidate.
            return { subject: getSnapshot(), landmarks: [], trackingLost: wasTracking };
        }
        candidate = next;
        if (!confirmed) {
            candidateStartedAt ??= timestampMs;
            candidateObservations = Math.min(profile.minimumCandidateObservations, candidateObservations + 1);
            reason = 'subject_stabilizing';
            if (timestampMs - candidateStartedAt >= profile.minimumCandidateDurationMs
                && candidateObservations >= profile.minimumCandidateObservations) {
                token ??= `candidate-${++nextToken}`;
            }
        }
        return { subject: getSnapshot(), landmarks: poses[0], trackingLost: false };
    };
    const confirm = confirmationToken => {
        const accepted = !confirmed && !restartRequired && candidate != null
            && typeof confirmationToken === 'string' && confirmationToken === token;
        if (accepted) { confirmed = true; token = null; reason = null; }
        return { accepted, subject: getSnapshot() };
    };
    const getSummary = () => ({
        version: profile.version, validationStatus: 'not-validated',
        selectionPolicy: 'explicit-stable-single-subject-confirmation',
        confirmationQualification: { minimumDurationMs: profile.minimumCandidateDurationMs,
            minimumObservations: profile.minimumCandidateObservations, validationStatus: 'not-validated' },
        lossPolicy: 'finish-segment-and-restart',
        maximumPoses: profile.maximumPoses, confirmedSegments: confirmed ? 1 : 0,
        interruptions, ambiguousFrames, unavailableFrames, admittedFrames,
        restartRequired, lastReason: reason,
    });
    return { update, confirm, interrupt, getSnapshot, getSummary };
}
