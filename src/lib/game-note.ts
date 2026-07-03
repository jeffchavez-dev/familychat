function formatPlayerNames(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function formatGameNote(names: string[], gameLabel: string): string {
  return `${formatPlayerNames(names)} played ${gameLabel}`;
}
