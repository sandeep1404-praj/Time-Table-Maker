import { formatTimeForDisplay } from "../utils/time.js";
import { logoDataUri } from "../utils/logo.js";

const formatDate = (date) => new Date(date).toISOString().slice(0, 10);
const getDayFull = (date) =>
  new Date(date).toLocaleDateString("en-IN", { weekday: "long" });
const formatDisplayDate = (dateStr) => {
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
};

const buildGroupedRows = (slots) => {
  const groups = [];
  const seen = new Map();
  slots.forEach((slot) => {
    const key = formatDate(slot.date);
    if (!seen.has(key)) {
      seen.set(key, []);
      groups.push({ key, slots: seen.get(key) });
    }
    seen.get(key).push(slot);
  });

  return groups
    .map(({ key, slots: groupSlots }) => {
      return groupSlots
        .map((slot, idx) => {
          const timeStr = `${formatTimeForDisplay(slot.startTime)} to ${formatTimeForDisplay(slot.endTime)}`;
          const dateTd = idx === 0
            ? `<td class="date" rowspan="${groupSlots.length}">${formatDisplayDate(key)}</td>`
            : "";
          const dayTd = idx === 0
            ? `<td class="day" rowspan="${groupSlots.length}">${getDayFull(key)}</td>`
            : "";
          return `<tr>${dateTd}${dayTd}<td>${slot.batch?.branch?.name || ""}</td><td>${slot.topic || ""}</td><td class="time">${timeStr}</td></tr>`;
        })
        .join("");
    })
    .join("");
};

const teacherTemplate = ({ teacherName, slots }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${teacherName} Timetable</title>
  <style>
    @page { size: A4 portrait; margin: 10mm 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Calibri, Arial, sans-serif; }
    .header { text-align: center; padding: 6mm 0 2mm; }
    .header img { height: 26mm; }
    .title-bar {
      background: #39BEF0;
      color: #fff;
      text-align: center;
      font-weight: 700;
      font-size: 13pt;
      padding: 3mm 0;
      margin-bottom: 0;
    }
    table { width: 100%; border-collapse: collapse; }
    th {
      background: #FFD600;
      color: #000;
      font-weight: 700;
      font-size: 10pt;
      padding: 2mm 2.5mm;
      border: 0.5pt solid #000;
      text-align: center;
    }
    td {
      font-size: 9pt;
      padding: 1.8mm 2.5mm;
      border: 0.5pt solid #000;
      vertical-align: middle;
      text-align: center;
    }
    td.date {
      font-weight: 600;
      font-size: 9.5pt;
      white-space: nowrap;
    }
    td.day {
      font-weight: 600;
      font-size: 9.5pt;
    }
    td.time {
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoDataUri}" alt="Guru Aanklan Academy" />
  </div>
  <div class="title-bar">${teacherName}</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Day</th>
        <th>Branch</th>
        <th>Topic</th>
        <th>Time</th>
      </tr>
    </thead>
    <tbody>
      ${buildGroupedRows(slots)}
    </tbody>
  </table>
</body>
</html>
`;

export { teacherTemplate };
