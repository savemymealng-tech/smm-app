/** Cart hydration can continue after the authentication startup screen closes. */
export function initializeApp({
  restoreAuth,
  restoreCart,
  onReady,
  onError,
}: {
  restoreAuth: () => Promise<unknown>;
  restoreCart: () => Promise<unknown>;
  onReady: () => void;
  onError: (error: unknown) => void;
}) {
  let active = true;
  void Promise.resolve().then(restoreCart).catch(onError);
  void Promise.resolve()
    .then(restoreAuth)
    .catch(onError)
    .finally(() => {
      if (active) onReady();
    });
  return () => {
    active = false;
  };
}
