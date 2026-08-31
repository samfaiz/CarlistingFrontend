/**
 * Region-gated sign-in providers.
 *
 * UAE Pass is the United Arab Emirates' national digital identity. Carsens is a
 * global marketplace, so offering it to every visitor on earth is noise at best
 * and confusing at worst — most of them cannot hold a UAE Pass account. The
 * integration is NOT removed; it is switched off by default and turned on per
 * deployment.
 *
 * To show the button again, set this in the Frontend environment (e.g.
 * `Frontend/.env.local`, or the deployment's env vars) and rebuild:
 *
 *     NEXT_PUBLIC_ENABLE_UAE_PASS=true
 *
 * Any other value — unset, "false", "1", "yes" — keeps it hidden. Next.js
 * inlines `NEXT_PUBLIC_*` at build time, so a running dev server or a built
 * bundle must be restarted/rebuilt after the value changes; flipping it does
 * not require a code edit.
 */
export const UAE_PASS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_UAE_PASS === "true";
