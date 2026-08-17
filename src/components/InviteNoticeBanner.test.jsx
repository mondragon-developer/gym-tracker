import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InviteNoticeBanner from './InviteNoticeBanner.jsx';

describe('InviteNoticeBanner', () => {
    it('explains the situation in English by default', () => {
        render(<InviteNoticeBanner onDismiss={() => {}} />);
        expect(screen.getByText(/trainer invitation was already used/)).toBeInTheDocument();
    });

    it('translates the copy when language=es', () => {
        render(<InviteNoticeBanner onDismiss={() => {}} language="es" />);
        expect(screen.getByText(/invitación de entrenador/)).toBeInTheDocument();
        expect(screen.getByText('Entendido')).toBeInTheDocument();
    });

    it('calls onDismiss when the button is clicked', () => {
        const onDismiss = vi.fn();
        render(<InviteNoticeBanner onDismiss={onDismiss} />);
        fireEvent.click(screen.getByText('Got it'));
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });
});
