export function textItems(values: string[]) {
  const occurrences = new Map<string, number>();
  return values.map((text) => {
    const occurrence = (occurrences.get(text) || 0) + 1;
    occurrences.set(text, occurrence);
    return { text, key: `${text}:${occurrence}` };
  });
}
