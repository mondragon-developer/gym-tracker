/**
 * DeleteAccountModal
 * Permanent deletion of the signed-in account. It says exactly what goes,
 * offers a backup first, and only enables the button once the user types
 * the confirmation word. The caller signs out after onDeleted.
 */

import React, { useState } from 'react';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import { ButtonVariant } from './ui/Button.constants.js';
import { deleteMyAccount, DELETE_CONFIRM_WORD } from '../services/AccountService.js';
import { t } from '../translations/ui';

const DeleteAccountModal = ({ isOpen, onClose, onBackup, onDeleted, isTrainer = false, language = 'en' }) => {
    const [typed, setTyped] = useState('');
    const [state, setState] = useState('idle'); // idle | deleting | admin | failed

    const confirmed = typed.trim().toUpperCase() === DELETE_CONFIRM_WORD;

    const handleDelete = async () => {
        if (!confirmed || state === 'deleting') return;
        setState('deleting');
        const result = await deleteMyAccount();
        if (result.ok) {
            onDeleted();
            return;
        }
        setState(result.reason);
    };

    return (
        <Modal isOpen={isOpen} onClose={state === 'deleting' ? () => {} : onClose} title={t('Delete my account', language)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', lineHeight: 1.5, color: 'var(--text-2)' }}>
                <p style={{ margin: 0 }}>
                    {t('This permanently deletes your account: your sign-in, every week of workouts, your custom exercises and your settings. It cannot be undone.', language)}
                </p>
                <p style={{ margin: 0 }}>
                    {isTrainer
                        ? t('Your clients will be unlinked from you. Their own workouts stay with them.', language)
                        : t('If you are linked to trainers, they will no longer see you as a client.', language)}
                </p>
                {onBackup && (
                    <div>
                        <Button variant={ButtonVariant.SECONDARY} onClick={onBackup}>
                            {t('Back up my data first', language)}
                        </Button>
                    </div>
                )}
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600, color: 'var(--text)' }}>
                    {t('Type DELETE to confirm', language)}
                    <input
                        value={typed}
                        onChange={(e) => { setTyped(e.target.value); if (state !== 'deleting') setState('idle'); }}
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        style={{
                            padding: '8px 10px',
                            border: '1px solid var(--border-strong)',
                            borderRadius: '8px',
                            fontSize: '15px',
                            backgroundColor: 'var(--surface)',
                            color: 'var(--text)'
                        }}
                    />
                </label>

                {state === 'admin' && (
                    <p role="alert" style={{ margin: 0, color: 'var(--danger)', fontWeight: 600 }}>
                        {t('Admin accounts cannot be deleted here. Change the role to user in the dashboard first.', language)}
                    </p>
                )}
                {state === 'failed' && (
                    <p role="alert" style={{ margin: 0, color: 'var(--danger)', fontWeight: 600 }}>
                        {t('Could not delete the account. Check your connection and try again.', language)}
                    </p>
                )}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button variant={ButtonVariant.SECONDARY} onClick={onClose} disabled={state === 'deleting'}>
                        {t('Cancel', language)}
                    </Button>
                    <Button variant={ButtonVariant.DANGER} onClick={handleDelete} disabled={!confirmed || state === 'deleting'}>
                        {state === 'deleting' ? t('Deleting...', language) : t('Delete my account', language)}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteAccountModal;
