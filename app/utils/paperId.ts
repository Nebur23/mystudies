export function parsePaperId(id: string) {
  const parts = id.split("-");
  if (parts.length !== 4) return null;
  
  const [level, subject, year, paper] = parts;
  if (!["olevel", "alevel"].includes(level)) return null;
  if (isNaN(Number(year))) return null;
  
  return { level, subject, year: Number(year), paper, paperId: id };
}

export function extractPaperId(input: string): string | null {

  //console.log("Extracting paper ID from input:", input);
  const match = input.match(/paper\s*(\d+)/i);
  
  if (!match) return null;

  const paperNumber = match[1];
  return `paper${paperNumber}`;
}