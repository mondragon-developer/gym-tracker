/**
 * LegalGate
 * Sits between AuthWrapper and the app: a signed-in account sees the
 * consent screen, not the app, until it has accepted the current version
 * of the terms. The app below is not mounted before that, so nothing loads
 * or saves for an account that has not agreed.
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { hasAcceptedLocally, fetchAccepted, recordAcceptance } from '../services/LegalService.js';
import PageLoading from './ui/PageLoading.jsx';
import { t } from '../translations/ui';

const LegalConsentScreen = React.lazy(() => import('./LegalConsentScreen.jsx'));

// index.html hides the Chatbase bubble unless this attribute is present,
// so the assistant is only reachable after the terms were accepted.
const ACCEPTED_ATTRIBUTE = 'data-legal-accepted';

export default function LegalGate({ children }) {
    const { user, signOut } = useAuth();
    const { language } = useLanguage();
    const userId = user?.id ?? null;
    // Result of the database check, tagged with the account it belongs to
    // so an answer for one account is never applied to the next.
    const [check, setCheck] = useState({ userId: null, accepted: false });

    const knownLocally = hasAcceptedLocally(userId);
    const checked = check.userId === userId;
    const accepted = knownLocally || (checked && check.accepted);

    useEffect(() => {
        if (!userId || knownLocally) return undefined;
        let cancelled = false;
        // A failed read (null) shows the consent screen too: accepting is
        // idempotent, and the app must not open on an unknown.
        fetchAccepted(userId).then((result) => {
            if (!cancelled) setCheck({ userId, accepted: result === true });
        });
        return () => {
            cancelled = true;
        };
    }, [userId, knownLocally]);

    useEffect(() => {
        if (!accepted) return undefined;
        document.documentElement.setAttribute(ACCEPTED_ATTRIBUTE, 'true');
        return () => document.documentElement.removeAttribute(ACCEPTED_ATTRIBUTE);
    }, [accepted]);

    if (accepted) return children;

    const loading = <PageLoading label={t('Loading...', language)} />;
    if (!checked) return loading;

    const handleAccept = async () => {
        const saved = await recordAcceptance(userId, language);
        if (saved) setCheck({ userId, accepted: true });
        return saved;
    };

    return (
        <main>
            <Suspense fallback={loading}>
                <LegalConsentScreen onAccept={handleAccept} onSignOut={signOut} language={language} />
            </Suspense>
        </main>
    );
}
