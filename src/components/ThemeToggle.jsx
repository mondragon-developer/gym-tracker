import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { t } from '../translations/ui';
import { headerControlStyle, headerControlHover, headerControlRest } from './ui/headerControlStyle.js';

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
                        style={headerControlStyle}
            onMouseOver={headerControlHover}
            onMouseOut={headerControlRest}
        >
            <Icon size={16} aria-hidden="true" />
            <span>{t(LABELS[theme], language)}</span>
        </button>
    );
};

export default ThemeToggle;
