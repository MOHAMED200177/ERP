import { useState, useCallback } from "react";

let _id = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = "success", duration = 3500) => {
    const id = ++_id;
    setToasts((p) => [...p, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), duration);
    }
  }, []);

  const remove = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  const success = useCallback((msg, dur)  => add(msg, "success", dur), [add]);
  const error   = useCallback((msg, dur)  => add(msg, "error",   dur), [add]);
  const warning = useCallback((msg, dur)  => add(msg, "warning", dur), [add]);

  return { toasts, add, remove, success, error, warning };
}
