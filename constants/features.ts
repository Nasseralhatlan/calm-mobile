/**
 * Feature flags.
 *
 * HOST_MODE_ENABLED — gates the guest↔host switching UI and the launch
 * redirect into the host shell. The host screens (`app/(host)/*`),
 * `mode-transition`, and the app-mode state all remain in place; flip this to
 * `true` to re-enable switching.
 */
export const HOST_MODE_ENABLED = false;
