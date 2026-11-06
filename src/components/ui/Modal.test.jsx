import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import Modal from './Modal.jsx';

afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
});

const pressEscape = () => fireEvent.keyDown(document, { key: 'Escape' });

describe('Modal nesting', () => {
    it('makes the background inert, preserves existing inert state and restores scroll style', () => {
        const background = document.createElement('button');
        const alreadyInert = document.createElement('div');
        alreadyInert.inert = true;
        document.body.append(background, alreadyInert);
        document.body.style.overflow = 'auto';
        const { unmount } = render(<Modal isOpen title="Dialog" onClose={() => {}}>Content</Modal>);
        expect(background.inert).toBe(true);
        expect(alreadyInert.inert).toBe(true);
        unmount();
        expect(background.inert).toBeFalsy();
        expect(alreadyInert.inert).toBe(true);
        expect(document.body.style.overflow).toBe('auto');
        background.remove();
        alreadyInert.remove();
    });
    it('contains keyboard focus, restores nested focus, and returns to the opener', () => {
        const opener = document.createElement('button'); document.body.appendChild(opener); opener.focus();
        const view = inner => <Modal isOpen onClose={() => {}} title="Outer"><button>Outer action</button>{inner && <Modal isOpen onClose={() => {}} title="Inner"><button>Inner action</button></Modal>}</Modal>;
        const { rerender, unmount } = render(view(false));
        const outer = document.querySelector('[role="dialog"]');
        expect(document.activeElement).toBe(outer);
        fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
        expect(document.activeElement.textContent).toBe('Outer action');
        rerender(view(true));
        expect(document.activeElement).not.toBe(outer);
        opener.focus();
        expect(document.activeElement.getAttribute('role')).toBe('dialog');
        rerender(view(false));
        expect(document.activeElement.textContent).toBe('Outer action');
        unmount(); expect(document.activeElement).toBe(opener); opener.remove();
    });
    it('locks body scroll while open and releases it on close', () => {
        const { rerender } = render(<Modal isOpen onClose={() => {}} title="One">x</Modal>);
        expect(document.body.style.overflow).toBe('hidden');
        rerender(<Modal isOpen={false} onClose={() => {}} title="One">x</Modal>);
        expect(document.body.style.overflow).toBe('');
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
        expect(document.body.style.overflow).toBe('');
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
