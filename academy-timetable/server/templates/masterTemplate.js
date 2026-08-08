import { formatTimeForDisplay } from "../utils/time.js";

const formatDate = (date) => new Date(date).toISOString().slice(0, 10);
const getDayName = (date) =>
  new Date(date).toLocaleDateString("en-IN", { weekday: "long" });
const formatDisplayDate = (dateStr) => {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

const SLOT_TYPE_LABEL = {
  "lecture": "",
  "lecture-theory": "",
  "lecture-mcq": "MCQ",
  "test": "TEST",
  "revision": "Revision",
  "coverup": "Coverup"
};

const buildRows = (slots, batches, extraDates = []) => {
  const dateSet = new Set([
    ...slots.map((s) => formatDate(s.date)),
    ...extraDates.map((d) => formatDate(d))
  ]);
  const dates = Array.from(dateSet).sort();

  return dates
    .map((date) => {
      const dayName = getDayName(date);
      const displayDate = formatDisplayDate(date);
      const cells = batches
        .map((batch) => {
          const cellSlots = slots.filter(
            (slot) =>
              slot.batch &&
              formatDate(slot.date) === date &&
              String(slot.batch?._id) === String(batch._id)
          );
          if (!cellSlots.length) return `<td></td>`;
          const content = cellSlots
            .map((slot, idx) => {
              const timeStr = `${formatTimeForDisplay(slot.startTime)}-${formatTimeForDisplay(slot.endTime)}`;
              const teacher = slot.teacher?.name || "";
              const topic = slot.topic || "";
              const typeLabel = SLOT_TYPE_LABEL[slot.slotType] ?? "";
              const parts = [`<span class="time">${timeStr}</span>`, `<span class="teacher">${teacher}</span>`];
              if (topic) parts.push(`<span class="topic">${topic}</span>`);
              if (typeLabel) parts.push(`<span class="type-label ${slot.slotType}">${typeLabel}</span>`);
              const separator = idx < cellSlots.length - 1 ? `<div class="slot-sep"></div>` : "";
              return `<div class="slot">${parts.join("")}</div>${separator}`;
            })
            .join("");
          return `<td>${content}</td>`;
        })
        .join("");

      return `<tr><td class="date"><div class="day">${dayName}</div><div class="dt">${displayDate}</div></td>${cells}</tr>`;
    })
    .join("");
};

const buildHeader = (batches) =>
  batches
    .map(
      (batch) =>
        `<th><div class="branch">${batch.branch?.name || ""}</div><div class="batch">${batch.name}</div></th>`
    )
    .join("");

const masterTemplate = ({ batches, slots, extraDates = [] }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Master Timetable</title>
  <style>
    @page { size: 420mm 297mm landscape; margin: 4mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Calibri, Arial, sans-serif; font-size: 7pt; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td {
      border: 0.5pt solid #000;
      padding: 1.5mm 1mm;
      font-size: 7pt;
      vertical-align: top;
      word-break: break-word;
    }
    th {
      background: #d9d9d9;
      text-align: center;
      vertical-align: middle;
    }
    th .branch { font-size: 6pt; color: #444; }
    th .batch  { font-size: 8pt; font-weight: 600; }
    td.date {
      background: #f2f2f2;
      vertical-align: middle;
      width: 20mm;
    }
    td.date .day { font-size: 8pt; font-weight: 500; }
    td.date .dt  { font-size: 7pt; color: #333; }
    .slot { display: flex; flex-direction: column; gap: 0.5mm; }
    .slot .time    { font-size: 7pt; font-weight: 500; }
    .slot .teacher { font-size: 7pt; }
    .slot .topic   { font-size: 6pt; color: #444; }
    .slot .type-label { font-size: 6pt; font-weight: 700; }
    .slot .test    { color: #b91c1c; }
    .slot .lecture-mcq { color: #6d28d9; }
    .slot-sep { height: 2mm; }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>
        <th style="width:20mm">Date</th>
        ${buildHeader(batches)}
      </tr>
    </thead>
    <tbody>
      ${buildRows(slots, batches, extraDates)}
    </tbody>
  </table>
</body>
</html>
`;

export { masterTemplate };
