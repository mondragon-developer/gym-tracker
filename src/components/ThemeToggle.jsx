import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { t } from '../translations/ui';

const ICONS = { system: Monitor, light: Sun, dark: Moon };
const LABELS = { system: 'System', light: 'Light', dark: 'Dark' };

/**
 * Header button cycling the theme: system, light, dark. Sits next to the
 * language and unit toggles and shares their translucent style, which works
 * on the header gradient in both themes.
 */
const ThemeToggle = () => {
    const { theme, cycleTheme } = useTheme();
    const { language } = useLanguage();
    const Icon = ICONS[theme];

    return (
        <button
            type="button"
            onClick={cycleTheme}
            aria-label={`${t('Theme', language)}: ${t(LABELS[theme], language)}`}
            title={t('Switch theme', language)}
            style={{
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '20px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                minHeight: '44px'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
        >
            <Icon size={16} aria-hidden="true" />
            <span>{t(LABELS[theme], language)}</span>
        </button>
    );
};

export default ThemeToggle;
