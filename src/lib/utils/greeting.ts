/**
 * Returns a time-based greeting key for i18n.
 * 05:00 – 11:59 → "goodMorning"
 * 12:00 – 16:59 → "goodAfternoon"
 * 17:00 – 04:59 → "goodEvening"
 */
export function getGreetingKey(): "goodMorning" | "goodAfternoon" | "goodEvening" {
  const hour = typeof window !== "undefined"
    ? new Date().getHours()
    : new Date().getHours();

  if (hour >= 5 && hour < 12) return "goodMorning";
  if (hour >= 12 && hour < 17) return "goodAfternoon";
  return "goodEvening";
}

/**
 * Returns a greeting string with the given name.
 * Use with i18n: t.admin.topbar.greeting[getGreetingKey()] or pass template + name.
 */
export function getGreeting(
  templates: { goodMorning: string; goodAfternoon: string; goodEvening: string },
  name: string
): string {
  const key = getGreetingKey();
  const template = templates[key];
  return template.replace(/\{name\}/g, name || "").trim() || name || "Hello";
}
