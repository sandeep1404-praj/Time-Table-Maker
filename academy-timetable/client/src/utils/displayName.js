export const normalizeDisplayText = (value) =>
  String(value ?? "")
    .split("\n")
    .map(line =>
      line
        .replace(/\s+/g, " ")
        .replace(/\s+([),.])/g, "$1")
        .trim()
    )
    .join("\n");

export const formatBatchDisplayName = (batch) => {
  const branchName = normalizeDisplayText(batch?.branch?.name || "");
  const batchName = normalizeDisplayText(batch?.name || "");

  return [branchName, batchName].filter(Boolean).join("\n");
};