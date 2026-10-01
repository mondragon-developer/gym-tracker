/**
 * Full-page spinner shown while the session or the terms acceptance is
 * being checked, before there is anything else to draw.
 */

import React from 'react';

const PageLoading = ({ label = 'Loading...' }) => (
    <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--surface-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }}>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
        }}>
            <div style={{
                width: '48px',
                height: '48px',
                border: '4px solid var(--border)',
                borderTopColor: 'var(--brand)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: 'var(--text-3)', fontSize: '16px' }}>{label}</p>
        </div>
    </div>
);

export default PageLoading;
