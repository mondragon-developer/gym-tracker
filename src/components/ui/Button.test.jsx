import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button.jsx';
import { ButtonVariant } from './Button.constants.js';

describe('Button hover', () => {
    it('keeps a caller background after hover instead of the variant color', () => {
        render(
            <Button variant={ButtonVariant.DANGER} style={{ background: 'var(--danger-soft)' }}>
                Restart
            </Button>
        );
        const button = screen.getByRole('button', { name: 'Restart' });
        fireEvent.mouseEnter(button);
        expect(button.style.background).toBe('var(--danger-soft)');
        fireEvent.mouseLeave(button);
        expect(button.style.background).toBe('var(--danger-soft)');
    });

    it('styles the button when the pointer enters through a child', () => {
        const { container } = render(
            <Button variant={ButtonVariant.PRIMARY}>
                <span>Save</span>
            </Button>
        );
        const button = screen.getByRole('button', { name: 'Save' });
        const label = container.querySelector('span');
        // React derives mouseenter from a mouseover coming from outside.
        fireEvent.mouseOver(label, { relatedTarget: document.body });
        expect(label.style.transform).toBe('');
        expect(button.style.transform).toBe('scale(1.02)');
        fireEvent.mouseOut(label, { relatedTarget: document.body });
        expect(button.style.transform).toBe('scale(1)');
        expect(button.style.background).toBe('var(--brand)');
    });
});
