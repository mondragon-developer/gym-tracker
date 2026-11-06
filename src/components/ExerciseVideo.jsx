import React, { useId, useState } from 'react';

// The video element is mounted only after an explicit play request.
export default function ExerciseVideo({ media, name, description, language, onError }) {
  const [started, setStarted] = useState(false);
  const descriptionId = useId();
  return (
    <figure style={{ margin: '0 auto', width: '100%', maxWidth: media.width }}>
      {started ? (
        <video src={media.video} poster={media.poster} controls autoPlay muted playsInline preload="none"
          aria-label={language === 'es' ? `Demostración de ${name}` : `${name} demonstration`}
          aria-describedby={description ? descriptionId : undefined} onError={onError}
          style={{ display: 'block', width: '100%', borderRadius: 8, background: 'var(--surface-3)' }} />
      ) : (
        <>
          <img src={media.poster} alt={name} onError={onError}
            style={{ display: 'block', width: '100%', borderRadius: 8, background: 'var(--surface-3)' }} />
          <button type="button" onClick={() => setStarted(true)}
            style={{ marginTop: 12, padding: '10px 16px', borderRadius: 6, border: '1px solid var(--border-strong)', color: 'var(--on-action)', background: 'var(--action)', cursor: 'pointer' }}>
            {language === 'es' ? 'Reproducir vídeo' : 'Play video'}
          </button>
        </>
      )}
      <figcaption style={{ marginTop: 12, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
        <span id={descriptionId}>{description}</span>
        <p style={{ margin: '8px 0 0' }}>{language === 'es'
          ? 'Clip sin sonido. Usa los controles para pausar o volver a reproducir.'
          : 'Silent clip. Use the player controls to pause or replay.'}</p>
      </figcaption>
    </figure>
  );
}
