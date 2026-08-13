/**
 * Canonical column order for batches in the master timetable.
 * Each entry is "BranchName|BatchName".
 * This order is fixed and must not be changed.
 */
const BATCH_ORDER = [
  "HDES|--",
  "DB|JEE",
  "Thane|11th CET",
  "Thane|11th N.I",
  "Thane|11th INT",
  "Thane|12th N.I",
  "Thane|12th INT",
  "GB|11th",
  "GB|12th",
  "Airoli|11th",
  "Airoli|12th",
  "Bhandup|11th N.I",
  "Bhandup|11th INT",
  "Bhandup|12th",
  "Powai|11th",
  "Powai|12th",
  "GHK|11th JEE",
  "GHK|11th NEET",
  "GHK|11th NI",
  "GHK|12th JEE",
  "GHK|12th NEET",
  "GHK|12th NI",
  "MD|--"
];

/**
 * Sorts an array of populated batch documents into the canonical order.
 * Batches not found in BATCH_ORDER are appended at the end.
 *
 * @param {Array} batches - Array of Batch documents (with .branch.name populated)
 * @returns {Array} Sorted batches
 */
const sortBatchesByOrder = (batches) => {
  return [...batches].sort((a, b) => {
    const keyA = `${a.branch?.name || ""}|${a.name}`;
    const keyB = `${b.branch?.name || ""}|${b.name}`;
    const idxA = BATCH_ORDER.indexOf(keyA);
    const idxB = BATCH_ORDER.indexOf(keyB);
    const rankA = idxA === -1 ? Infinity : idxA;
    const rankB = idxB === -1 ? Infinity : idxB;
    return rankA - rankB;
  });
};

export { BATCH_ORDER, sortBatchesByOrder };
