import { useEffect, useId, useState } from 'react';
import { adminService } from '../services/AdminService';
import { t } from '../translations/ui';
import Button from './ui/Button.jsx';
import { ButtonVariant } from './ui/Button.constants.js';

/** An on-demand directory page, independent of the current user-list page. */
export default function TrainerPicker({ assignedIds, onAssign, onClose, language }) {
  const searchId = useId();
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [trainers, setTrainers] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await adminService.listUsers({ page, search, role: 'trainer', signal: controller.signal });
        if (!current) return;
        setTrainers(result.users);
        setHasMore(result.hasMore);
      } catch (err) {
        if (current && !controller.signal.aborted) {
          console.error('Error loading trainers:', err);
          setTrainers([]);
          setHasMore(false);
          setError(t('Could not load trainers. Please try again.', language));
        }
      } finally {
        if (current) setLoading(false);
      }
    };
    load();
    return () => { current = false; controller.abort(); };
  }, [page, search, language, reload]);

  const available = trainers.filter(trainer => !assignedIds.includes(trainer.id));
  const assign = async (id) => {
    const trainer = available.find(candidate => candidate.id === id);
    if (!trainer || assigning) return;
    setAssigning(true);
    try { await onAssign(trainer); } finally { setAssigning(false); }
  };

  return (
    <div style={{ padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', maxWidth: '240px' }}>
      <form onSubmit={event => { event.preventDefault(); setPage(0); setSearch(draft.trim()); }}>
        <label htmlFor={searchId} style={{ display: 'block', fontSize: '12px' }}>{t('Search trainers by email', language)}</label>
        <input id={searchId} type="search" value={draft} maxLength={254} onChange={event => setDraft(event.target.value)} style={{ width: '100%', boxSizing: 'border-box', margin: '4px 0' }} />
        <Button type="submit" variant={ButtonVariant.SECONDARY} style={{ fontSize: '12px' }}>{t('Search', language)}</Button>
      </form>
      {error && <div><p role="alert" style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</p><Button variant={ButtonVariant.SECONDARY} onClick={() => setReload(value => value + 1)} style={{ fontSize: '12px' }}>{t('Retry', language)}</Button></div>}
      <select
        value=""
        aria-label={t('Choose a trainer', language)}
        disabled={loading || assigning || available.length === 0}
        onChange={event => assign(event.target.value)}
        style={{ width: '100%', marginTop: '6px', fontSize: '12px' }}
      >
        <option value="">{loading ? t('Loading trainers...', language) : t('Choose a trainer', language)}</option>
        {available.map(trainer => <option key={trainer.id} value={trainer.id}>{trainer.email || trainer.id}</option>)}
      </select>
      {!loading && !error && available.length === 0 && <p style={{ fontSize: '12px' }}>{t('No available trainers on this page.', language)}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '6px' }}>
        <Button variant={ButtonVariant.SECONDARY} aria-label={t('Previous trainer page', language)} disabled={loading || assigning || page === 0} onClick={() => setPage(value => value - 1)} style={{ fontSize: '12px' }}>←</Button>
        <span style={{ fontSize: '12px' }}>{t('Page', language)} {page + 1}</span>
        <Button variant={ButtonVariant.SECONDARY} aria-label={t('Next trainer page', language)} disabled={loading || assigning || !hasMore} onClick={() => setPage(value => value + 1)} style={{ fontSize: '12px' }}>→</Button>
        <Button variant={ButtonVariant.SECONDARY} disabled={assigning} onClick={onClose} style={{ fontSize: '12px' }}>{t('Close', language)}</Button>
      </div>
    </div>
  );
}
