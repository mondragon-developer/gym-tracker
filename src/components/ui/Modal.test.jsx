import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import Modal from './Modal.jsx';

afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
});

const pressEscape = () => fireEvent.keyDown(document, { key: 'Escape' });

describe('Modal nesting', () => {
    it('locks body scroll while open and releases it on close', () => {
        const { rerender } = render(<Modal isOpen onClose={() => {}} title="One">x</Modal>);
        expect(document.body.style.overflow).toBe('hidden');
        rerender(<Modal isOpen={false} onClose={() => {}} title="One">x</Modal>);
        expect(document.body.style.overflow).toBe('unset');
    });

    it('sends Escape only to the topmost modal', () => {
        const closeOuter = vi.fn();
        const closeInner = vi.fn();
        render(
            <>
                <Modal isOpen onClose={closeOuter} title="Outer">outer</Modal>
                <Modal isOpen onClose={closeInner} title="Inner">inner</Modal>
            </>
        );
        pressEscape();
        expect(closeInner).toHaveBeenCalledTimes(1);
        expect(closeOuter).not.toHaveBeenCalled();
    });

    it('keeps the scroll lock until the last open modal closes', () => {
        const { rerender } = render(
            <>
                <Modal isOpen onClose={() => {}} title="Outer">outer</Modal>
                <Modal isOpen onClose={() => {}} title="Inner">inner</Modal>
            </>
        );
        rerender(
            <>
                <Modal isOpen onClose={() => {}} title="Outer">outer</Modal>
                <Modal isOpen={false} onClose={() => {}} title="Inner">inner</Modal>
            </>
        );
        expect(document.body.style.overflow).toBe('hidden');
        rerender(
            <>
                <Modal isOpen={false} onClose={() => {}} title="Outer">outer</Modal>
                <Modal isOpen={false} onClose={() => {}} title="Inner">inner</Modal>
            </>
        );
        expect(document.body.style.overflow).toBe('unset');
    });

    it('lets the outer modal answer Escape again once the inner one closed', () => {
        const closeOuter = vi.fn();
        const { rerender } = render(
            <>
                <Modal isOpen onClose={closeOuter} title="Outer">outer</Modal>
                <Modal isOpen onClose={() => {}} title="Inner">inner</Modal>
            </>
        );
        rerender(
            <>
                <Modal isOpen onClose={closeOuter} title="Outer">outer</Modal>
                <Modal isOpen={false} onClose={() => {}} title="Inner">inner</Modal>
            </>
        );
        pressEscape();
        expect(closeOuter).toHaveBeenCalledTimes(1);
    });
});
