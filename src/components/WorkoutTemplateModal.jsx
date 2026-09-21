/**
 * WorkoutTemplateModal
 * Lets the user pick one of the ready-made weekly plans. Applying one
 * replaces the viewed week, so each card asks for a second click before
 * reporting the choice; the caller decides which week the plan replaces.
 */

import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import { ButtonVariant } from './ui/Button.constants.js';
import { WORKOUT_TEMPLATES } from '../constants/workoutTemplates.js';
import { t } from '../translations/ui';

const WorkoutTemplateModal = ({ isOpen, onClose, onSelect, language = 'en' }) => {
  // Card waiting for its confirming click; reset whenever the modal closes.
  const [confirmingId, setConfirmingId] = useState(null);
  useEffect(() => {
    if (!isOpen) setConfirmingId(null);
  }, [isOpen]);

  const handleClick = (templateId) => {
    if (confirmingId === templateId) {
      setConfirmingId(null);
      onSelect(templateId);
      return;
    }
    setConfirmingId(templateId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('Workout templates', language)}>
      <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '14px', lineHeight: 1.5 }}>
        {t('Replaces the exercises of the week you are viewing. Completion, logged sets and weights are cleared.', language)}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {WORKOUT_TEMPLATES.map(tpl => {
          const confirming = confirmingId === tpl.id;
          return (
            <div
              key={tpl.id}
              style={{
                border: confirming ? '1px solid #f59e0b' : '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#164e63', fontSize: '15px' }}>{t(tpl.name, language)}</span>
                <span style={{ fontSize: '12px', color: '#0e7490', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {tpl.daysPerWeek} {t('days/week', language)} · {tpl.minutes} {t('min', language)}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: 1.5 }}>
                {t(tpl.description, language)}
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant={confirming ? ButtonVariant.DANGER : ButtonVariant.PRIMARY}
                  onClick={() => handleClick(tpl.id)}
                  style={{ fontSize: '13px', padding: '8px 14px' }}
                >
                  {confirming ? t('Replace this week?', language) : t('Use this plan', language)}
                </Button>
                {confirming && (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '13px', fontWeight: 600 }}
                  >
                    {t('Cancel', language)}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default WorkoutTemplateModal;
