/**
 * RestoreBackupModal
 * Picks a backup file, shows what is in it, and hands the history back
 * after a second tap. Restoring replaces every week on the account, so the
 * summary and the confirm step come before anything changes; the caller
 * offers Undo afterwards.
 */

import React, { useState } from 'react';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import { ButtonVariant } from './ui/Button.constants.js';
import { parseBackup } from '../utils/backup.js';
import { formatWeekRange } from '../utils/dateHelper.js';
import { t } from '../translations/ui';

const formatDate = (iso, language) => {
    try {
        return new Date(iso).toLocaleDateString(language === 'es' ? 'es' : 'en', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
};

const RestoreBackupModal = ({ isOpen, onClose, onRestore, language = 'en' }) => {
    const [result, setResult] = useState(null);
    const [fileName, setFileName] = useState('');
    const [confirming, setConfirming] = useState(false);

    const handleFile = async (event) => {
        const file = event.target.files && event.target.files[0];
        setConfirming(false);
        if (!file) return;
        setFileName(file.name);
        try {
            setResult(parseBackup(await file.text()));
        } catch {
            setResult({ ok: false, error: 'Could not read that file.' });
        }
    };

    const handleRestore = () => {
        if (!result?.ok) return;
        if (!confirming) {
            setConfirming(true);
            return;
        }
        onRestore(result.history);
    };

    const summary = result?.ok ? result.summary : null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('Restore from backup', language)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '14px', lineHeight: 1.5 }}>
                    {t('Choose a backup file you saved with Back up my data. Restoring replaces all your weeks with the ones in the file.', language)}
                </p>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}>
                    {t('Backup file', language)}
                    <input type="file" accept=".json,application/json" onChange={handleFile} style={{ fontSize: '14px' }} />
                </label>

                {result && !result.ok && (
                    <p role="alert" style={{ margin: 0, color: 'var(--danger)', fontSize: '13px', fontWeight: 600 }}>
                        {t(result.error, language)}
                    </p>
                )}

                {summary && (
                    <div
                        data-testid="backup-summary"
                        style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 12px', background: 'var(--surface-2)', fontSize: '14px', color: 'var(--text)', lineHeight: 1.6 }}
                    >
                        <div style={{ fontWeight: 700, wordBreak: 'break-all' }}>{fileName}</div>
                        {result.exportedAt && <div>{t('Saved on', language)} {formatDate(result.exportedAt, language)}</div>}
                        <div>{summary.weeks} {t(summary.weeks === 1 ? 'week' : 'weeks', language)}, {summary.exercises} {t('exercises', language)}</div>
                        <div style={{ color: 'var(--text-3)', fontSize: '13px' }}>
                            {formatWeekRange(summary.firstWeek, language)}
                            {summary.lastWeek !== summary.firstWeek && ` ${t('to', language)} ${formatWeekRange(summary.lastWeek, language)}`}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button variant={ButtonVariant.SECONDARY} onClick={onClose}>
                        {t('Cancel', language)}
                    </Button>
                    <Button
                        variant={confirming ? ButtonVariant.DANGER : ButtonVariant.PRIMARY}
                        onClick={handleRestore}
                        disabled={!summary}
                    >
                        {confirming ? t('Replace all my weeks?', language) : t('Restore', language)}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default RestoreBackupModal;
