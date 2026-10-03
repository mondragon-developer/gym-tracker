import React from 'react';
import { Star } from 'lucide-react';
export default function FavoriteButton({ active, onClick, name, language = 'en' }) {
    const label = language === 'es' ? (active ? 'Quitar de favoritos' : 'Añadir a favoritos') : (active ? 'Remove from favorites' : 'Add to favorites');
    return <button type="button" aria-label={`${label}: ${name}`} aria-pressed={active} title={label}
        onClick={event => { event.stopPropagation(); onClick(); }}
        style={{ background: active ? 'var(--skipped-soft)' : 'transparent', border: 'none', color: active ? 'var(--skipped)' : 'var(--text-3)', padding: 9, minWidth: 36, minHeight: 36, borderRadius: 8, cursor: 'pointer', flexShrink: 0 }}>
        <Star size={17} fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>;
}
