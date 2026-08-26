export function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function joinTags(tags: string[]): string {
  return tags.join(", ");
}

export function addTag(current: string, next: string): string {
  let value = current;
  for (const piece of splitTags(next)) {
    const existing = splitTags(value);
    if (existing.some((tag) => tag.toLowerCase() === piece.toLowerCase())) {
      continue;
    }
    value = joinTags([...existing, piece]);
  }
  return value;
}

export function removeTag(current: string, tag: string): string {
  return joinTags(
    splitTags(current).filter((item) => item.toLowerCase() !== tag.toLowerCase()),
  );
}

export function filterSuggestions(
  suggestions: readonly string[],
  query: string,
  selected: readonly string[],
): string[] {
  const q = query.trim().toLowerCase();
  const selectedSet = new Set(selected.map((item) => item.toLowerCase()));
  return suggestions.filter((item) => {
    if (selectedSet.has(item.toLowerCase())) return false;
    if (!q) return true;
    return item.toLowerCase().includes(q);
  });
}

export function splitPoints(value: string): string[] {
  if (value.includes("\n")) {
    return value
      .split("\n")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return splitTags(value);
}

export function joinPoints(points: string[]): string {
  return points.join("\n");
}

export function addPoint(current: string, next: string): string {
  const piece = next.trim();
  if (!piece) return current;
  const existing = splitPoints(current);
  if (existing.some((point) => point.toLowerCase() === piece.toLowerCase())) {
    return current;
  }
  return joinPoints([...existing, piece]);
}

export function removePoint(current: string, point: string): string {
  return joinPoints(
    splitPoints(current).filter(
      (item) => item.toLowerCase() !== point.toLowerCase(),
    ),
  );
}

export function withExtraChoice(
  options: readonly string[],
  value: string | null,
): string[] {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return [...options];
  if (options.some((option) => option.toLowerCase() === trimmed.toLowerCase())) {
    return [...options];
  }
  return [...options, trimmed];
}
