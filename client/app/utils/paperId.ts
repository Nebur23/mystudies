export function parsePaperId(id: string) {
  const match = id.match(/^(olevel|alevel)-([a-z0-9_-]+)-(\d{4})-(paper\d+)$/i);
  if (!match) return null;

  const [, level, subject, year, paper] = match;
  return {
    level: level.toLowerCase(),
    subject: subject.toLowerCase(),
    year: Number(year),
    paper: paper.toLowerCase(),
    paperId: id,
  };
}

export function extractPaperId(input: string): string | null {
  const match = input.match(/paper\s*(\d+)/i);
  if (!match) return null;

  return `paper${match[1]}`;
}