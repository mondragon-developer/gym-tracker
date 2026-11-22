export const normalizeTempoTarget = (target) => {
    if (target == null) return null;
    if (typeof target !== 'object' || Array.isArray(target)) {
        throw new TypeError('The tempo target must contain duration ranges in seconds.');
    }
    const result = {};
    for (const phase of ['descentSeconds', 'ascentSeconds']) {
        const range = target[phase];
        if (range == null) continue;
        if (!Number.isFinite(range.min) || !Number.isFinite(range.max)
            || range.min < 0 || range.max <= 0 || range.max < range.min) {
            throw new RangeError('Tempo ranges require finite, ordered, nonnegative durations.');
        }
        result[phase] = Object.freeze({ min: range.min, max: range.max });
    }
    return Object.keys(result).length ? Object.freeze(result) : null;
};

export const compareTempo = (repetition, target) => {
    const phases = {};
    for (const phase of ['descentSeconds', 'ascentSeconds']) {
        const range = target?.[phase];
        phases[phase] = !range ? 'not_configured'
            : repetition[phase] < range.min ? 'faster'
                : repetition[phase] > range.max ? 'slower' : 'within_target';
    }
    const configured = Object.values(phases).filter(status => status !== 'not_configured');
    return {
        ...phases,
        status: !configured.length ? 'not_configured'
            : configured.every(status => status === 'within_target') ? 'within_target' : 'outside_target',
    };
};

export const repetitionFeedback = (repetition) => {
    if (repetition.tempo.status === 'within_target') {
        return { code: 'tempo_target_met', tone: 'positive', message: 'Your repetition timing matched the selected target.' };
    }
    const descriptions = [];
    for (const [field, name] of [['descentSeconds', 'descent'], ['ascentSeconds', 'ascent']]) {
        const result = repetition.tempo[field];
        if (result === 'faster' || result === 'slower') descriptions.push(`Your ${name} was ${result} than the selected target.`);
    }
    return descriptions.length
        ? { code: 'tempo_outside_target', tone: 'neutral', message: descriptions.join(' ') }
        : { code: 'repetition_measured', tone: 'neutral', message: 'Repetition measured. No timing target was configured.' };
};
