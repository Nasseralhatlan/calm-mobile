// Config for the shared confirm sheet (app/confirm.tsx). The action can't be
// passed through route params, so the opener stashes it here and the route
// reads it.
export interface ConfirmConfig {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

let current: ConfirmConfig | null = null;

export function setConfirm(config: ConfirmConfig): void {
  current = config;
}

export function getConfirm(): ConfirmConfig | null {
  return current;
}
