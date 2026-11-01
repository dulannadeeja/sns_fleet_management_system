/** A real calendar day as YYYY-MM-DD (not 30 February). */
export const realDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;

/** Today in Sri Lanka, as YYYY-MM-DD (times are read in Asia/Colombo, system design 5.1). */
export const todayColombo = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
