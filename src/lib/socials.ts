/**
 * Social destinations for the public site.
 *
 * Empty until the owner supplies real handles — the brand is still TBD. An
 * `href="#"` is worse than no link, especially on a phone: tapping it jumps the
 * reader to the top of the page, and assistive tech announces a link that goes
 * nowhere. Consumers render a non-interactive mark when the URL is empty, so
 * the moment a real URL lands here it becomes a working link everywhere.
 */
export const SOCIALS: Record<string, string> = {
  X: "",
  Facebook: "",
  Instagram: "",
  LinkedIn: "",
  YouTube: "",
};

/** True when a destination is configured for this network. */
export const hasSocial = (name: string): boolean => Boolean(SOCIALS[name]);
