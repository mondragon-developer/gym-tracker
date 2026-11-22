/** Coordinates application reloads with active work and persistence guards. */
export function createAppUpdateCoordinator({ dispatch, reload }) {
  const activities = new Set();
  let pending = false;
  let dispatching = false;

  const complete = () => {
    if (!pending || activities.size) return false;
    pending = false;
    reload();
    return true;
  };

  const resume = () => {
    if (!pending || activities.size || dispatching) return;
    dispatching = true;
    try {
      // A persistence listener cancels the event and calls complete once safe.
      if (dispatch()) complete();
    } finally {
      dispatching = false;
    }
  };

  return {
    request() {
      pending = true;
      resume();
    },
    complete,
    resume,
    isProtected: () => activities.size > 0,
    protect() {
      const token = Symbol('protected activity');
      activities.add(token);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        activities.delete(token);
        resume();
      };
    }
  };
}

export const appUpdates = createAppUpdateCoordinator({
  dispatch: () => window.dispatchEvent(new CustomEvent('gym:app-update-ready', { cancelable: true })),
  reload: () => window.location.reload()
});
