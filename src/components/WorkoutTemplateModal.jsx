/**
 * WorkoutTemplateModal
 * Lets the user pick one of the ready-made weekly plans. The caller decides
 * which week the plan replaces (the viewed editable week).
 */

import React from 'react';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import { ButtonVariant } from './ui/Button.constants.js';
import { WORKOUT_TEMPLATES } from '../constants/workoutTemplates.js';
import { t } from '../translations/ui';

const WorkoutTemplateModal = ({ isOpen, onClose, onSelect, language = 'en' }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={t('Workout templates', language)}>
    <p style={{ margin: '0 0 16px', color: '#6b7280', fontSize: '14px', lineHeight: 1.5 }}>
      {t('Replaces the exercises of the week you are viewing. Weights start empty.', language)}
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {WORKOUT_TEMPLATES.map(tpl => (
        <div
          key={tpl.id}
          style={{
            border: '1px solid #e5e7eb',
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
          <Button
            variant={ButtonVariant.PRIMARY}
            onClick={() => onSelect(tpl.id)}
            style={{ alignSelf: 'flex-start', fontSize: '13px', padding: '8px 14px' }}
          >
            {t('Use this plan', language)}
          </Button>
        </div>
      ))}
    </div>
  </Modal>
);

export default WorkoutTemplateModal;
