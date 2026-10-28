const day = new Intl.DateTimeFormat("mn-MN", {
  month: "long",
  day: "numeric",
  timeZone: "Asia/Ulaanbaatar",
});

/** "10-р сарын 28" style date for a stored ISO timestamp. */
export const formatDay = (iso: string) => day.format(new Date(iso));
