/**
 * Shared look for the navy pills in the app header (language, units,
 * theme, profile). One height and radius so the row reads as one group.
 * The header gradient is dark in both themes, so white text is fine here.
 */
export const HEADER_CONTROL_HEIGHT = '44px';

export const headerControlStyle = {
    height: HEADER_CONTROL_HEIGHT,
    padding: '0 16px',
    background: 'var(--header-control)',
    border: '1px solid var(--header-control-border)',
    borderRadius: '22px',
    color: 'var(--header-text)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)'
};

export const headerControlHover = (e) => {
    e.currentTarget.style.background = 'var(--header-control-hover)';
    e.currentTarget.style.borderColor = 'var(--header-control-border)';
};

export const headerControlRest = (e) => {
    e.currentTarget.style.background = 'var(--header-control)';
    e.currentTarget.style.borderColor = 'var(--header-control-border)';
};
