/**
 * Shared look for the translucent pills in the app header (language, units,
 * theme, profile). One height and radius so the row reads as one group.
 * The header gradient is dark in both themes, so white text is fine here.
 */
export const HEADER_CONTROL_HEIGHT = '44px';

export const headerControlStyle = {
    height: HEADER_CONTROL_HEIGHT,
    padding: '0 16px',
    background: 'rgba(255, 255, 255, 0.2)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '22px',
    color: 'white',
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
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
};

export const headerControlRest = (e) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
};
