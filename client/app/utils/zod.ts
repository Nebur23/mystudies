

// ─── Error formatter ──────────────────────────────────────────────────────────
//
// Zod's raw fieldErrors are Record<field, string[]>. We turn each field into a
// single readable sentence so the UI can render them cleanly.

export function formatZodErrors(
  fieldErrors: Record<string, string[] | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(([, messages]) => messages && messages.length > 0)
      .map(([field, messages]) => {
        // Capitalise the field name and join multiple messages
        const label = field.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
        return [field, `${label}: ${messages!.join(". ")}`];
      }),
  );
}