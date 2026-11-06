import { useEffect, useRef } from 'react';

// A shared stack allows a timer alert to open above an existing modal.
const dialogs = [];
const originalInert = new Map();
let originalOverflow = '';

const updateInert = () => {
    for (const [element, inert] of originalInert) element.inert = inert;
    originalInert.clear();
    let active = dialogs.at(-1)?.dialog;
    while (active && active !== document.body) {
        for (const sibling of active.parentElement?.children || []) {
            if (sibling !== active && sibling instanceof HTMLElement) {
                originalInert.set(sibling, sibling.inert);
                sibling.inert = true;
            }
        }
        active = active.parentElement;
    }
};

export default function useDialogFocus(isOpen, dialogRef, onClose, initialFocusRef) {
    const closeRef = useRef(onClose);
    closeRef.current = onClose;
    useEffect(() => {
        if (!isOpen || !dialogRef.current) return undefined;
        const dialog = dialogRef.current;
        const opener = document.activeElement;
        const entry = { dialog };
        if (!dialogs.length) originalOverflow = document.body.style.overflow;
        dialogs.push(entry);
        document.body.style.overflow = 'hidden';
        updateInert();
        (initialFocusRef?.current || dialog).focus();
        const isTop = () => dialogs.at(-1) === entry;
        const containFocus = (event) => {
            if (isTop() && !dialog.contains(event.target)) (initialFocusRef?.current || dialog).focus();
        };
        const onKey = (event) => {
            if (!isTop()) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                closeRef.current?.();
            }
            if (event.key !== 'Tab') return;
            const items = [...dialog.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')]
                .filter(el => !el.disabled && el.tabIndex >= 0 && !el.closest('[hidden], [inert]') && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
            const first = items[0];
            const last = items.at(-1);
            if (!first || (event.shiftKey && (document.activeElement === first || document.activeElement === dialog))) {
                event.preventDefault();
                (last || dialog).focus();
            } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
                event.preventDefault();
                (first || dialog).focus();
            }
        };
        document.addEventListener('focusin', containFocus);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('focusin', containFocus);
            document.removeEventListener('keydown', onKey);
            const wasTop = isTop();
            dialogs.splice(dialogs.indexOf(entry), 1);
            updateInert();
            if (!dialogs.length) document.body.style.overflow = originalOverflow;
            if (wasTop && opener?.isConnected && !opener.closest('[inert]')) opener.focus();
        };
    }, [isOpen, dialogRef, initialFocusRef]);
}
