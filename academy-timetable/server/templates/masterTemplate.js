const formatDate = (date) => new Date(date).toISOString().slice(0, 10);

const buildRows = (slots, batches) => {
  const dates = Array.from(new Set(slots.map((slot) => formatDate(slot.date)))).sort();

  return dates
    .map((date) => {
      const cells = batches
        .map((batch) => {
          const cellSlots = slots.filter(
            (slot) =>
              formatDate(slot.date) === date &&
              String(slot.batch?._id) === String(batch._id)
          );
          if (!cellSlots.length) return "";
          return cellSlots
            .map((slot) => `${slot.startTime}-${slot.endTime} ${slot.topic || ""}`)
            .join("<br/>");
        })
        .map((cell) => `<td>${cell}</td>`)
        .join("");

      return `<tr><td class="date">${date}</td>${cells}</tr>`;
    })
    .join("");
};

const buildHeader = (batches) =>
  batches
    .map(
      (batch) =>
        `<th><div class="branch">${batch.branch?.name || ""}</div><div class="batch">${
          batch.name
        }</div></th>`
    )
    .join("");

const masterTemplate = ({ academyName, batches, slots }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Master Timetable</title>
  <style>
    @page { size: A4 landscape; margin: 0.5in; }
    body { font-family: Arial, sans-serif; padding: 12px; }
    h1 { margin-bottom: 4px; }
    h2 { margin-top: 0; color: #555; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #cfcfcf; padding: 6px; font-size: 9pt; vertical-align: top; }
    th { background: #f2f2f2; text-align: center; }
    td.date { background: #f2f2f2; font-weight: 700; text-align: center; }
    .branch { font-size: 8pt; color: #666; }
    .batch { font-size: 9pt; font-weight: 700; }
  </style>
</head>
<body>
  <h1>${academyName}</h1>
  <h2>Master Timetable</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        ${buildHeader(batches)}
      </tr>
    </thead>
    <tbody>
      ${buildRows(slots, batches)}
    </tbody>
  </table>
</body>
</html>
`;

module.exports = { masterTemplate };
