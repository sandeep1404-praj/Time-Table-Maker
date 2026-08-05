const formatRows = (slots) =>
  slots
    .map(
      (slot) => `
        <tr>
          <td>${slot.date}</td>
          <td>${slot.day}</td>
          <td>${slot.branch}</td>
          <td>${slot.time}</td>
          <td>${slot.topic}</td>
        </tr>
      `
    )
    .join("");

const teacherTemplate = ({ academyName, teacherName, rows }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${teacherName} Timetable</title>
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
  <h2>${teacherName} - Weekly Timetable</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Day</th>
        <th>Branch</th>
        <th>Time</th>
        <th>Topic</th>
      </tr>
    </thead>
    <tbody>
      ${formatRows(rows)}
    </tbody>
  </table>
</body>
</html>
`;

export { teacherTemplate };
