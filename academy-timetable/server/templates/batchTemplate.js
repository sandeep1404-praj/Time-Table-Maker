const formatRows = (slots) =>
  slots
    .map(
      (slot) => `
        <tr>
          <td>${slot.date}</td>
          <td>${slot.day}</td>
          <td>${slot.faculty}</td>
          <td>${slot.chapter}</td>
          <td>${slot.time}</td>
        </tr>
      `
    )
    .join("");

const batchTemplate = ({ academyName, batchName, rows }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${batchName} Timetable</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    h1 { margin-bottom: 8px; }
    h2 { margin-top: 0; color: #555; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f2f2f2; }
  </style>
</head>
<body>
  <h1>${academyName}</h1>
  <h2>${batchName} - Weekly Timetable</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Day</th>
        <th>Faculty</th>
        <th>Chapter</th>
        <th>Time</th>
      </tr>
    </thead>
    <tbody>
      ${formatRows(rows)}
    </tbody>
  </table>
</body>
</html>
`;

export { batchTemplate };
