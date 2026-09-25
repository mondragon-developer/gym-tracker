/**
 * ImportPlanModal
 * The user pastes the GYMPLAN block the AI coach wrote, checks how each
 * line resolved against the library, decides per day whether to replace,
 * add or skip, and applies the result in one go. With a list of weeks the
 * user also picks which week the plan lands on (the tracker offers this week
 * and the next twelve); without one it targets the week passed in (the
 * trainer's client editor). The caller owns the weeks and the undo, this
 * modal only hands back the plan and the chosen week.
 */

import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import { ButtonVariant } from './ui/Button.constants.js';
import { DAYS_OF_WEEK } from '../constants/AppConstants.js';
import { parsePlanText, buildWeekFromImport, IMPORT_PRESETS, DAY_MODES } from '../utils/planImport.js';
import { useUnits } from '../hooks/useUnits.js';
import { formatWeekRange } from '../utils/dateHelper.js';
import { t } from '../translations/ui';
import { translateExercise, translateMuscleGroup } from '../translations/exercises';

const REPLACE_HELP = 'Every day follows this plan. Days the plan does not list become Rest.';
const MERGE_HELP = 'Only the days in the plan change; every other day keeps what it has. For each plan day choose Replace day (swap in these exercises), Add to day (keep yours and add these) or Skip (leave it as it is).';

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

// "This week (Sep 21 - 27)", "Next week (...)", then the date range alone.
const weekOptionLabel = (weekStart, index, language) => {
    const range = formatWeekRange(weekStart, language);
    if (index === 0) return `${t('This week', language)} (${range})`;
    if (index === 1) return `${t('Next week', language)} (${range})`;
    return `${t('Week of', language)} ${range}`;
};

const describeExisting = (day, language) => {
    if (!day) return null;
    const count = day.exercises?.length ?? 0;
    const name = translateMuscleGroup(day.name || 'Rest', language);
    if (count === 0) return `${t('Now', language)}: ${name}`;
    return `${t('Now', language)}: ${name}, ${count} ${t('exercises', language)}`;
};

const ImportPlanModal = ({
    isOpen,
    onClose,
    onApply,
    existingWeek = {},
    weeks = null,
    initialWeek = null,
    planForWeek = null,
    language = 'en',
    initialText = ''
}) => {
    const { unit } = useUnits();
    const hasWeekChoice = Array.isArray(weeks) && weeks.length > 0 && typeof planForWeek === 'function';
    const [targetWeek, setTargetWeek] = useState(() => (
        hasWeekChoice ? (weeks.includes(initialWeek) ? initialWeek : weeks[0]) : null
    ));
    const targetPlan = hasWeekChoice ? (planForWeek(targetWeek) ?? {}) : existingWeek;
    const targetIndex = hasWeekChoice ? weeks.indexOf(targetWeek) : 0;
    const [text, setText] = useState('');
    const [parsed, setParsed] = useState(null);
    const [error, setError] = useState(null);
    const [preset, setPreset] = useState(IMPORT_PRESETS.REPLACE);
    const [perDay, setPerDay] = useState({});
    const [choices, setChoices] = useState({});
    const [confirming, setConfirming] = useState(false);
    const [clipboardHint, setClipboardHint] = useState(null);

    useEffect(() => {
        if (isOpen) return;
        setText('');
        setParsed(null);
        setError(null);
        setChoices({});
        setConfirming(false);
        setClipboardHint(null);
    }, [isOpen]);

    const handlePreview = (source = text) => {
        const result = parsePlanText(source);
        const listed = Object.keys(result.days);
        if (listed.length === 0) {
            setError(result.errors[0] ?? { line: 1, message: 'No plan found in the text' });
            return;
        }
        setError(null);
        setText(source);
        setParsed(result);
        setPreset(listed.length >= 4 ? IMPORT_PRESETS.REPLACE : IMPORT_PRESETS.MERGE);
        setPerDay(Object.fromEntries(listed.map(day => [day, DAY_MODES.REPLACE])));
        setChoices({});
        setConfirming(false);
    };

    // Text handed in by the page (a paste anywhere) goes straight to preview.
    useEffect(() => {
        if (isOpen && initialText) handlePreview(initialText);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialText]);

    // One tap instead of long-press, select, paste. Browsers ask once for
    // permission; where reading is refused the hint points at the box.
    const canReadClipboard = typeof navigator !== 'undefined' && Boolean(navigator.clipboard && navigator.clipboard.readText);
    const pasteFromClipboard = async () => {
        try {
            const value = await navigator.clipboard.readText();
            if (!value || !value.trim()) {
                setClipboardHint('The clipboard is empty. Copy the plan from the chat first.');
                return;
            }
            setClipboardHint(null);
            handlePreview(value);
        } catch {
            setClipboardHint('Could not read the clipboard here. Paste into the box instead.');
        }
    };

    const handleApply = () => {
        if (!confirming) {
            setConfirming(true);
            return;
        }
        const { plan } = buildWeekFromImport(parsed, targetPlan, { preset, perDay, choices, unit });
        setConfirming(false);
        onApply(plan, targetWeek);
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
        // What this day has in the target week, so Replace and Add are
        // chosen knowing what they touch.
        const existingNote = describeExisting(targetPlan[weekday], language);
        return (
            <div key={weekday} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 12px', background: 'var(--surface-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: day.exercises.length > 0 ? '4px' : 0 }}>
                    <div style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '15px' }}>{t(weekday, language)}</span>
                        {label && <span style={{ marginLeft: '8px', fontSize: '13px', color: 'var(--text-3)' }}>{label}</span>}
                        {existingNote && <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{existingNote}</div>}
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

    // The current week keeps the familiar wording; another week names it.
    const otherWeek = hasWeekChoice && targetIndex > 0;
    const range = otherWeek ? formatWeekRange(targetWeek, language) : '';
    let applyLabel;
    if (!confirming) {
        applyLabel = otherWeek ? `${t('Apply to week of', language)} ${range}` : t('Apply to this week', language);
    } else if (preset === IMPORT_PRESETS.REPLACE) {
        applyLabel = otherWeek ? `${t('Replace week of', language)} ${range}?` : t('Replace this week?', language);
    } else {
        applyLabel = otherWeek ? `${t('Apply to week of?', language)} ${range}?` : t('Apply to this week?', language);
    }

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
                    {clipboardHint && (
                        <p role="status" style={{ margin: 0, color: 'var(--text-3)', fontSize: '13px' }}>{t(clipboardHint, language)}</p>
                    )}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {canReadClipboard && (
                            <Button variant={ButtonVariant.PRIMARY} onClick={pasteFromClipboard}>
                                {t('Paste from clipboard', language)}
                            </Button>
                        )}
                        <Button variant={canReadClipboard ? ButtonVariant.SECONDARY : ButtonVariant.PRIMARY} onClick={() => handlePreview()} disabled={!text.trim()}>
                            {t('Preview', language)}
                        </Button>
                    </div>
                </div>
            )}

            {parsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {hasWeekChoice && (
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}>
                            {t('Set up the plan for', language)}
                            <select
                                value={targetWeek}
                                onChange={(e) => { setTargetWeek(e.target.value); setConfirming(false); }}
                                style={{ ...selectStyle, fontSize: '14px', padding: '8px 10px' }}
                            >
                                {weeks.map((weekStart, index) => (
                                    <option key={weekStart} value={weekStart}>{weekOptionLabel(weekStart, index, language)}</option>
                                ))}
                            </select>
                        </label>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" style={segmentStyle(preset === IMPORT_PRESETS.REPLACE)} onClick={() => setPreset(IMPORT_PRESETS.REPLACE)} aria-pressed={preset === IMPORT_PRESETS.REPLACE}>
                            {t('Replace whole week', language)}
                        </button>
                        <button type="button" style={segmentStyle(preset === IMPORT_PRESETS.MERGE)} onClick={() => setPreset(IMPORT_PRESETS.MERGE)} aria-pressed={preset === IMPORT_PRESETS.MERGE}>
                            {t('Merge into week', language)}
                        </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.45, color: 'var(--text-3)' }}>
                        {preset === IMPORT_PRESETS.REPLACE ? t(REPLACE_HELP, language) : t(MERGE_HELP, language)}
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
                            {applyLabel}
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
