/**
 * Auth Context Definition
 * Separated from the provider so component files export only components
 * (required for React Fast Refresh), mirroring languageContextDef.js.
 */

import { createContext } from 'react';

export const AuthContext = createContext(null);
