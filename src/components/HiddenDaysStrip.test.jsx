import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HiddenDaysStrip from './HiddenDaysStrip.jsx';

describe('HiddenDaysStrip', () => {
    it('renders nothing when no day is hidden', () => {
        const { container } = render(<HiddenDaysStrip days={[]} onShow={() => {}} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('lists hidden days and shows one again on click', () => {
        const onShow = vi.fn();
        render(<HiddenDaysStrip days={['Saturday', 'Sunday']} onShow={onShow} />);
        expect(screen.getByText('Saturday')).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText('Show Sunday'));
        expect(onShow).toHaveBeenCalledWith('Sunday');
    });

    it('offers no action on read-only weeks and translates day names', () => {
        render(<HiddenDaysStrip days={['Sunday']} onShow={() => {}} language="es" readOnly />);
        expect(screen.getByText('Domingo')).toBeInTheDocument();
        expect(screen.queryByRole('button')).toBeNull();
    });
});
