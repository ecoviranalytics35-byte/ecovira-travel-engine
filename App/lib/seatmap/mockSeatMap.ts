// lib/seatmap/mockSeatMap.ts
export type SeatLetter = "A" | "B" | "C" | "D" | "E" | "F";
export type SeatStatus = "available" | "unavailable" | "premium";

export type SeatCell = {
  row: number;
  letter: SeatLetter;
  status: SeatStatus;
  price: number; // 0 for free
};

export type SeatRow = {
  row: number;
  // A B | aisle | C D | aisle | E F
  seats: Record<SeatLetter, SeatCell>;
};

// Deterministic seat rules (no randomness):
// - Premium rows: 1-3 and 10-12 (example)
// - Unavailable seats: a fixed set based on row+letter
// - Paid seats: premium always paid; some standard paid rows: exit-ish row 14, 15
const UNAVAILABLE_SET = new Set<string>([
  "2C",
  "2D",
  "5A",
  "6F",
  "9B",
  "11E",
  "12F",
  "14C",
  "18D",
  "20A",
  "23F",
  "26B",
  "28E",
]);

function isPremiumRow(row: number) {
  return (row >= 1 && row <= 3) || (row >= 10 && row <= 12);
}

function isExitRow(row: number) {
  return row === 14 || row === 15;
}

function seatKey(row: number, letter: SeatLetter) {
  return `${row}${letter}`;
}

function seatStatus(row: number, letter: SeatLetter): SeatStatus {
  if (UNAVAILABLE_SET.has(seatKey(row, letter))) return "unavailable";
  if (isPremiumRow(row)) return "premium";
  return "available";
}

function seatPrice(row: number, letter: SeatLetter): number {
  const status = seatStatus(row, letter);
  if (status === "unavailable") return 0;

  // Premium always paid
  if (status === "premium") return 35;

  // Exit rows slightly paid
  if (isExitRow(row)) return 25;

  // Window seats sometimes paid in mid-cabin (deterministic)
  const isWindow = letter === "A" || letter === "F";
  if (isWindow && row >= 16 && row <= 22) return 15;

  return 0;
}

export function buildMockSeatMap(totalRows = 30): SeatRow[] {
  const letters: SeatLetter[] = ["A", "B", "C", "D", "E", "F"];

  const rows: SeatRow[] = [];
  for (let row = 1; row <= totalRows; row++) {
    const seats = {} as Record<SeatLetter, SeatCell>;
    for (const letter of letters) {
      const status = seatStatus(row, letter);
      seats[letter] = {
        row,
        letter,
        status,
        price: seatPrice(row, letter),
      };
    }
    rows.push({ row, seats });
  }
  return rows;
}

