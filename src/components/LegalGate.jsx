/**
 * LegalGate
 * Sits between AuthWrapper and the app: a signed-in account sees the
 * consent screen, not the app, until it has accepted the current version
 * of the terms. The assistant widget is not even downloaded before that.
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { hasAcceptedLocally, fetchAccepted, recordAcceptance } from '../services/LegalService.js';
import { loadChatbase } from '../lib/chatbase.js';
import PageLoading from './ui/PageLoading.jsx';
import { t } from '../translations/ui';

const LegalConsentScreen = React.lazy(() => import('./LegalConsentScreen.jsx'));

// index.html hides the Chatbase bubble unless this attribute is present,
// which covers the widget staying loaded after a sign-out.
const ACCEPTED_ATTRIBUTE = 'data-legal-accepted';

export default function LegalGate({ children }) {
    const { user, signOut } = useAuth();
    const { language } = useLanguage();
    const userId = user?.id ?? null;
    // Answer from the database, tagged with the account it belongs to so
    // it is never applied to the next one: true, false, or null when the
    // database could not be reached.
    const [check, setCheck] = useState({ userId: null, result: null });

    const knownLocally = hasAcceptedLocally(userId);
    const checked = check.userId === userId;
    // The local copy opens the app without waiting and keeps it open
    // offline, but the database has the last word: a definite "no row"
    // closes the app again (fetchAccepted also drops the local copy).
    const accepted = checked && check.result !== null ? check.result : knownLocally;

    useEffect(() => {
        if (!userId) return undefined;
        let cancelled = false;
        fetchAccepted(userId).then((result) => {
            if (!cancelled) setCheck({ userId, result });
        });
        return () => {
            cancelled = true;
        };
    }, [userId]);

    useEffect(() => {
        if (!accepted) return undefined;
        document.documentElement.setAttribute(ACCEPTED_ATTRIBUTE, 'true');
        loadChatbase();
        return () => document.documentElement.removeAttribute(ACCEPTED_ATTRIBUTE);
    }, [accepted]);

    if (accepted) return children;

    const loading = <PageLoading label={t('Loading...', language)} />;
    if (!checked) return loading;

    const handleAccept = async () => {
        const saved = await recordAcceptance(userId, language);
        if (saved) setCheck({ userId, result: true });
        return saved;
    };

    // Keyed by language: the ticks belong to the text that was on screen,
    // so switching language starts the two boxes over.
    return (
        <main>
            <Suspense fallback={loading}>
                <LegalConsentScreen key={language} onAccept={handleAccept} onSignOut={signOut} language={language} />
            </Suspense>
        </main>
    );
}
