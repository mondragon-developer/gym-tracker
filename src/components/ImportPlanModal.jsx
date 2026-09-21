/**
 * ImportPlanModal
 * The user pastes the GYMPLAN block the AI coach wrote, checks how each
 * line resolved against the library, decides per day whether to replace,
 * add or skip, and applies the result to the viewed week in one go. The
 * caller owns the week and the undo, this modal only hands back the plan.
 */

import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import { ButtonVariant } from './ui/Button.constants.js';
import { DAYS_OF_WEEK } from '../constants/AppConstants.js';
import { parsePlanText, buildWeekFromImport, IMPORT_PRESETS, DAY_MODES } from '../utils/planImport.js';
import { useUnits } from '../hooks/useUnits.js';
import { t } from '../translations/ui';
import { translateExercise, translateMuscleGroup } from '../translations/exercises';

const PLACEHOLDER = 'GYMPLAN v1\nMonday: Chest & Triceps\n- Barbell Bench Press 4x6-8\n- Rope Pushdowns 3x12-15\nTuesday: Rest';

const badgeStyle = (tone) => ({
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '999px',
    whiteSpace: 'nowrap',
    background: `var(--${tone}-soft)`,
    color: `var(--${tone})`,
    border: `1px solid var(--${tone}-border)`
});

const selectStyle = {
    padding: '6px 8px',
    borderRadius: '8px',
    border: '1px solid var(--border-strong)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '13px',
    maxWidth: '100%'
};

const segmentStyle = (active) => ({
    flex: 1,
    padding: '8px 10px',
    borderRadius: '10px',
    border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
    background: active ? 'var(--brand)' : 'var(--surface)',
    color: active ? 'var(--on-brand)' : 'var(--text-2)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
});

const describeIssue = (issue, language) => {
    const text = t(issue.message, language);
    const where = `${t('Line', language)} ${issue.line}`;
    return issue.name ? `${where}: ${text} (${issue.name})` : `${where}: ${text}`;
};

const specOf = (item) => {
    if (item.minutes) return `${item.minutes} min`;
    if (item.sets) return `${item.sets}x${item.reps}`;
    return '';
};

const ImportPlanModal = ({ isOpen, onClose, onApply, existingWeek = {}, language = 'en' }) => {
    const { unit } = useUnits();
    const [text, setText] = useState('');
    const [parsed, setParsed] = useState(null);
    const [error, setError] = useState(null);
    const [preset, setPreset] = useState(IMPORT_PRESETS.REPLACE);
    const [perDay, setPerDay] = useState({});
    const [choices, setChoices] = useState({});
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        if (isOpen) return;
        setText('');
        setParsed(null);
        setError(null);
        setChoices({});
        setConfirming(false);
    }, [isOpen]);

    const handlePreview = () => {
        const result = parsePlanText(text);
        const listed = Object.keys(result.days);
        if (listed.length === 0) {
            setError(result.errors[0] ?? { line: 1, message: 'No plan found in the text' });
            return;
        }
        setError(null);
        setParsed(result);
        setPreset(listed.length >= 4 ? IMPORT_PRESETS.REPLACE : IMPORT_PRESETS.MERGE);
        setPerDay(Object.fromEntries(listed.map(day => [day, DAY_MODES.REPLACE])));
        setChoices({});
        setConfirming(false);
    };

    const handleApply = () => {
        if (!confirming) {
            setConfirming(true);
            return;
        }
        const { plan } = buildWeekFromImport(parsed, existingWeek, { preset, perDay, choices, unit });
        setConfirming(false);
        onApply(plan);
    };

    // What the row will become after the user's dropdown choice, if any.
    const effectiveMatch = (item) => {
        const choice = choices[item.key];
        if (choice === 'custom') return { tone: 'skipped', label: 'Custom', dbId: null };
        if (typeof choice === 'number') return { tone: 'done', label: 'Library', dbId: choice };
        if (item.match.dbId !== null) return { tone: 'done', label: 'Library', dbId: item.match.dbId };
        if (item.match.candidates.length > 0) return { tone: 'danger', label: 'Choose', dbId: null };
        return { tone: 'skipped', label: 'Custom', dbId: null };
    };

    const renderRow = (item, dimmed) => {
        const { tone, label } = effectiveMatch(item);
        const needsSelect = item.match.confidence === 'fuzzy' || (item.match.dbId === null && item.match.candidates.length > 0);
        const selectValue = choices[item.key] ?? (item.match.confidence === 'fuzzy' ? item.match.dbId : 'custom');
        const chosen = typeof choices[item.key] === 'number'
            ? item.match.candidates.find(candidate => candidate.dbId === choices[item.key])
            : null;
        const libraryName = chosen ? chosen.name : (item.match.dbId !== null ? item.match.name : null);
        const shownName = libraryName && choices[item.key] !== 'custom'
            ? translateExercise(libraryName, language)
            : item.typedName;
        return (
            <div
                key={item.key}
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '6px 10px',
                    padding: '6px 0',
                    borderTop: '1px solid var(--border)',
                    opacity: dimmed ? 0.45 : 1
                }}
            >
                <span style={{ flex: '1 1 160px', minWidth: 0, fontSize: '14px', color: 'var(--text)', wordBreak: 'break-word' }}>{shownName}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{specOf(item)}</span>
                <span style={badgeStyle(tone)}>{t(label, language)}</span>
                {needsSelect && (
                    <select
                        aria-label={`${t('Exercise match', language)}: ${item.typedName}`}
                        value={String(selectValue)}
                        onChange={(e) => {
                            const value = e.target.value;
                            setChoices(prev => ({ ...prev, [item.key]: value === 'custom' ? 'custom' : Number(value) }));
                        }}
                        style={{ ...selectStyle, flexBasis: '100%' }}
                    >
                        {item.match.candidates.map(candidate => (
                            <option key={candidate.dbId} value={String(candidate.dbId)}>
                                {t('Matched to', language)} {translateExercise(candidate.name, language)}
                            </option>
                        ))}
                        <option value="custom">{t('Keep as custom', language)}: {item.typedName}</option>
                    </select>
                )}
            </div>
        );
    };

    const renderDay = (weekday) => {
        const day = parsed.days[weekday];
        const mode = perDay[weekday] ?? DAY_MODES.REPLACE;
        const dimmed = mode === DAY_MODES.SKIP;
        const label = day.rest ? translateMuscleGroup('Rest', language) : translateMuscleGroup(day.groups.join(' & '), language);
        return (
            <div key={weekday} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 12px', background: 'var(--surface-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: day.exercises.length > 0 ? '4px' : 0 }}>
                    <div style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '15px' }}>{t(weekday, language)}</span>
                        {label && <span style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--text-3)' }}>{label}</span>}
                    </div>
                    <select
                        aria-label={`${t('Day mode', language)}: ${t(weekday, language)}`}
                        value={mode}
                        onChange={(e) => setPerDay(prev => ({ ...prev, [weekday]: e.target.value }))}
                        style={selectStyle}
                    >
                        <option value={DAY_MODES.REPLACE}>{t('Replace day', language)}</option>
                        <option value={DAY_MODES.ADD}>{t('Add to day', language)}</option>
                        <option value={DAY_MODES.SKIP}>{t('Skip', language)}</option>
                    </select>
                </div>
                {day.exercises.map(item => renderRow(item, dimmed))}
            </div>
        );
    };

    const blocked = parsed ? parsed.errors.length > 0 : true;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('Import plan', language)}>
            {!parsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '14px', lineHeight: 1.5 }}>
                        {t('Ask the AI coach for a plan, tap Copy on its answer and paste it here.', language)}
                    </p>
                    <textarea
                        aria-label={t('Paste the plan here', language)}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={PLACEHOLDER}
                        rows={10}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '10px 12px',
                            border: '1px solid var(--border-strong)',
                            borderRadius: '10px',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            fontSize: '13px',
                            resize: 'vertical'
                        }}
                    />
                    {error && (
                        <p role="alert" style={{ margin: 0, color: 'var(--danger)', fontSize: '13px', fontWeight: 600 }}>
                            {describeIssue(error, language)}
                        </p>
                    )}
                    <Button variant={ButtonVariant.PRIMARY} onClick={handlePreview} disabled={!text.trim()}>
                        {t('Preview', language)}
                    </Button>
                </div>
            )}

            {parsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" style={segmentStyle(preset === IMPORT_PRESETS.REPLACE)} onClick={() => setPreset(IMPORT_PRESETS.REPLACE)} aria-pressed={preset === IMPORT_PRESETS.REPLACE}>
                            {t('Replace whole week', language)}
                        </button>
                        <button type="button" style={segmentStyle(preset === IMPORT_PRESETS.MERGE)} onClick={() => setPreset(IMPORT_PRESETS.MERGE)} aria-pressed={preset === IMPORT_PRESETS.MERGE}>
                            {t('Merge into week', language)}
                        </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-3)' }}>
                        {preset === IMPORT_PRESETS.REPLACE ? t('Unlisted days become Rest', language) : t('Unlisted days stay as they are', language)}
                    </p>

                    {DAYS_OF_WEEK.filter(day => parsed.days[day]).map(renderDay)}

                    {parsed.errors.length > 0 && (
                        <ul role="alert" style={{ margin: 0, paddingLeft: '18px', color: 'var(--danger)', fontSize: '13px' }}>
                            {parsed.errors.map((issue, index) => <li key={index}>{describeIssue(issue, language)}</li>)}
                        </ul>
                    )}
                    {parsed.warnings.length > 0 && (
                        <ul style={{ margin: 0, padding: '8px 12px 8px 26px', background: 'var(--info-soft)', color: 'var(--info)', borderRadius: '10px', fontSize: '12px' }}>
                            {parsed.warnings.map((issue, index) => <li key={index}>{describeIssue(issue, language)}</li>)}
                        </ul>
                    )}

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button variant={ButtonVariant.SECONDARY} onClick={() => { setParsed(null); setConfirming(false); }}>
                            {t('Back', language)}
                        </Button>
                        <Button
                            variant={confirming ? ButtonVariant.DANGER : ButtonVariant.PRIMARY}
                            onClick={handleApply}
                            disabled={blocked}
                        >
                            {confirming
                                ? (preset === IMPORT_PRESETS.REPLACE ? t('Replace this week?', language) : t('Apply to this week?', language))
                                : t('Apply to this week', language)}
                        </Button>
                        {confirming && (
                            <button
                                type="button"
                                onClick={() => setConfirming(false)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}
                            >
                                {t('Cancel', language)}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default ImportPlanModal;
