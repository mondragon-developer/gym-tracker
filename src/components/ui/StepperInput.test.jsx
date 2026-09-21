import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StepperInput from './StepperInput.jsx';
import { stepNumbers } from '../../utils/stepNumbers.js';

describe('stepNumbers', () => {
    it('moves plain numbers by the step and clamps at the minimum', () => {
        expect(stepNumbers('3', 1)).toBe('4');
        expect(stepNumbers('0', -1)).toBe('0');
        expect(stepNumbers('135', 5, { min: 0 })).toBe('140');
    });

    it('moves both ends of a range', () => {
        expect(stepNumbers('8-10', 1)).toBe('9-11');
        expect(stepNumbers('8-10', -1)).toBe('7-9');
    });

    it('starts from the fallback when the field is empty or not a number', () => {
        expect(stepNumbers('', 1, { fallback: 3 })).toBe('4');
        expect(stepNumbers('abc', -1, { fallback: 3 })).toBe('2');
    });

    it('keeps decimals sane for weights', () => {
        expect(stepNumbers('22.5', 2.5)).toBe('25');
        expect(stepNumbers('20', -2.5)).toBe('17.5');
    });
});

describe('StepperInput', () => {
    const theme = { background: '#fff', borderColor: '#ccc', focusColor: '#000', focusShadow: 'none' };

    it('types freely and steps with the buttons', () => {
        const onChange = vi.fn();
        render(<StepperInput value="8-10" onChange={onChange} ariaLabel="Reps" {...theme} />);
        fireEvent.change(screen.getByLabelText('Reps'), { target: { value: '12' } });
        expect(onChange).toHaveBeenLastCalledWith('12');
        fireEvent.click(screen.getByLabelText('Reps +1'));
        expect(onChange).toHaveBeenLastCalledWith('9-11');
    });

    it('uses the numeric keyboard hint and respects max', () => {
        const onChange = vi.fn();
        render(<StepperInput value="4" onChange={onChange} max={4} ariaLabel="Sets" inputMode="numeric" {...theme} />);
        expect(screen.getByLabelText('Sets')).toHaveAttribute('inputmode', 'numeric');
        fireEvent.click(screen.getByLabelText('Sets +1'));
        expect(onChange).toHaveBeenLastCalledWith('4');
    });
});
