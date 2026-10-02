import React, { useEffect, useRef, useState } from 'react';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import { ButtonVariant } from './ui/Button.constants.js';
import { t } from '../translations/ui.js';
import { approveTrainer, listMyTrainers, previewTrainer, removeTrainerAccess } from '../services/TrainerAccessService.js';

export default function TrainerAccessModal({ language, initialCode = '', onClose }) {
    const [code, setCode] = useState(initialCode);
    const [preview, setPreview] = useState(null);
    const [trainers, setTrainers] = useState(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);
    const inFlight = useRef(false);
    const request = useRef(0);
    const alive = useRef(true);

    useEffect(() => {
        alive.current = true;
        listMyTrainers().then(rows => {
            if (alive.current) setTrainers(rows);
        }).catch(() => {
            if (alive.current) setError('Could not load connected trainers. Close this window and try again.');
        });
        return () => { alive.current = false; };
    }, []);

    const review = async (event) => {
        event.preventDefault();
        if (!code.trim() || inFlight.current) return;
        const token = ++request.current;
        inFlight.current = true;
        setBusy(true);
        setPreview(null);
        setError('');
        setNotice('');
        try {
            const trainer = await previewTrainer(code);
            if (!alive.current || token !== request.current) return;
            if (trainer) setPreview({ ...trainer, code: code.trim().toUpperCase() });
            else setError('That trainer code is not valid.');
        } catch {
            if (alive.current && token === request.current) setError('Could not review this invitation. Try again.');
        } finally {
            inFlight.current = false;
            if (alive.current) setBusy(false);
        }
    };

    const mutate = async (action, success) => {
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            await action();
            if (!alive.current) return;
            setPreview(null);
            setCode('');
            setNotice(success);
            // A list refresh failure must not be reported as a failed removal.
            try {
                const rows = await listMyTrainers();
                if (alive.current) setTrainers(rows);
            } catch {
                if (alive.current) {
                    setTrainers(null);
                    setError('Access was updated, but the list could not refresh. Close this window and try again.');
                }
            }
        } catch {
            if (alive.current) setError('Could not update trainer access. Review the invitation or try again.');
        } finally {
            inFlight.current = false;
            if (alive.current) setBusy(false);
        }
    };

    return (
        <Modal isOpen title={t('Connected trainers', language)} onClose={() => { if (!inFlight.current) onClose(); }} style={{ width: '560px' }}>
            <p>{t('Trainers you connect can see your account name and email and view and edit your entire workout history, plans, notes and custom exercises.', language)}</p>
            <p>{t('Removing access blocks future access through the app. It cannot erase information a trainer already viewed or copied. Your workouts stay in your account.', language)}</p>
            {error && <p role="alert" style={{ color: 'var(--danger)' }}>{t(error, language)}</p>}
            {notice && <p role="status" style={{ color: 'var(--done)' }}>{t(notice, language)}</p>}
            {trainers === null && !error && <p role="status">{t('Loading...', language)}</p>}
            {trainers?.length === 0 && <p>{t('No connected trainers.', language)}</p>}
            {trainers?.map(trainer => (
                <div key={trainer.trainer_id} style={{ borderBottom: '1px solid var(--border)', padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ overflowWrap: 'anywhere' }}>{trainer.display_name || t('Trainer', language)}</span>
                    <Button variant={ButtonVariant.DANGER} disabled={busy} aria-label={`${t('Remove access', language)}: ${trainer.display_name || t('Trainer', language)}`} onClick={() => mutate(() => removeTrainerAccess(trainer.trainer_id), 'Trainer access removed.')}>
                        {t('Remove access', language)}
                    </Button>
                </div>
            ))}
            <form onSubmit={review} style={{ marginTop: '24px' }}>
                <label htmlFor="trainer-access-code">{t('Trainer code', language)}</label>
                <input id="trainer-access-code" value={code} maxLength={12} autoComplete="off" disabled={busy} onChange={event => {
                    ++request.current;
                    setCode(event.target.value.toUpperCase());
                    setPreview(null);
                    setError('');
                    setNotice('');
                }} style={{ display: 'block', width: '100%', boxSizing: 'border-box', margin: '8px 0 12px', padding: '12px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border-strong)', borderRadius: '8px' }} />
                <Button type="submit" disabled={busy || !code.trim()} variant={ButtonVariant.SECONDARY}>{t('Review invitation', language)}</Button>
            </form>
            {preview && (
                <section style={{ marginTop: '20px', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <h3 style={{ overflowWrap: 'anywhere' }}>{preview.display_name || t('Trainer', language)}</h3>
                    <p>{t('This display name is supplied by the trainer. We have not verified their identity or qualifications. Confirm the invitation with someone you know.', language)}</p>
                    <p>{t('Only approve if you want this trainer to have the access described above. You can remove access here at any time.', language)}</p>
                    <Button disabled={busy} onClick={() => mutate(() => approveTrainer(preview.code, preview.trainer_id, language), 'Connected to your trainer.')}>
                        {t('Allow this trainer to view and edit my workouts', language)}
                    </Button>
                </section>
            )}
            <Button variant={ButtonVariant.SECONDARY} disabled={busy} onClick={onClose} style={{ marginTop: '20px' }}>{t('Close', language)}</Button>
        </Modal>
    );
}
