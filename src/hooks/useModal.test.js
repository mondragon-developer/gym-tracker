import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useModal from './useModal.js';

describe('useModal', () => {
  it('starts closed by default', () => {
    const { result } = renderHook(() => useModal());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('respects a provided initial state', () => {
    const { result } = renderHook(() => useModal(true));
    expect(result.current.isOpen).toBe(true);
  });

  it('open() stores the supplied data', () => {
    const { result } = renderHook(() => useModal());
    act(() => result.current.open('Monday'));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toBe('Monday');
  });

  it('close() clears both state and data', () => {
    const { result } = renderHook(() => useModal());
    act(() => result.current.open({ id: 1 }));
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('toggle() flips the state and accepts data on open', () => {
    const { result } = renderHook(() => useModal());
    act(() => result.current.toggle('payload'));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toBe('payload');
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });
});
