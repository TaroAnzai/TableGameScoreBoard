const blockers = new Set<symbol>();

export const registerExternalNavigationBlock = () => {
  const token = Symbol('external-navigation-block');
  blockers.add(token);

  let isRegistered = true;
  return () => {
    if (!isRegistered) return;
    isRegistered = false;
    blockers.delete(token);
  };
};

export const isExternalNavigationBlocked = () => blockers.size > 0;
