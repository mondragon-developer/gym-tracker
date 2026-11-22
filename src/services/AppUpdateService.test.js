import { describe, expect, it, vi } from 'vitest';
import { createAppUpdateCoordinator } from './AppUpdateService.js';

const setup = (claimed = false) => {
  const dispatch = vi.fn(() => !claimed);
  const reload = vi.fn();
  return { service: createAppUpdateCoordinator({ dispatch, reload }), dispatch, reload };
};

describe('application update coordination', () => {
  it('reloads an unclaimed update when there is no protected work', () => {
    const { service, dispatch, reload } = setup();
    service.request();
    expect(dispatch).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
    service.resume();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('coalesces updates until all overlapping activities finish', () => {
    const { service, dispatch, reload } = setup();
    const finishMeasurement = service.protect();
    const finishFinalization = service.protect();
    service.request();
    service.request();
    expect(dispatch).not.toHaveBeenCalled();
    finishMeasurement();
    finishMeasurement();
    expect(service.isProtected()).toBe(true);
    expect(reload).not.toHaveBeenCalled();
    finishFinalization();
    expect(service.isProtected()).toBe(false);
    expect(dispatch).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('waits for persistence and checks for new activity before committing', () => {
    const { service, reload } = setup(true);
    service.request();
    expect(reload).not.toHaveBeenCalled();
    const finish = service.protect();
    expect(service.complete()).toBe(false);
    finish();
    expect(reload).not.toHaveBeenCalled();
    expect(service.complete()).toBe(true);
    expect(service.complete()).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('retries a deferred persistence guard without looping on failure', () => {
    const { service, dispatch, reload } = setup(true);
    service.request();
    expect(dispatch).toHaveBeenCalledOnce();
    expect(reload).not.toHaveBeenCalled();
    service.resume();
    expect(dispatch).toHaveBeenCalledTimes(2);
    service.complete();
    service.resume();
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does not recursively dispatch when a listener releases an activity', () => {
    const reload = vi.fn();
    let service;
    const dispatch = vi.fn(() => {
      const finish = service.protect();
      finish();
      service.complete();
      return false;
    });
    service = createAppUpdateCoordinator({ dispatch, reload });
    service.request();
    expect(dispatch).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
  });
});
