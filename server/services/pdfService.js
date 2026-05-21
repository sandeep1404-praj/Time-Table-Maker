const puppeteer = require('puppeteer');
const TimeSlot = require('../models/TimeSlot');
const logger = require('../config/logger');

const getTeacherPDFHtml = (teacherName, slots) => {
  const rows = slots.map(slot => {
    const date = new Date(slot.date);
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    return `
      <tr>
        <td>${dateStr}</td>
        <td>${day}</td>
        <td>${slot.batch?.name || 'N/A'}</td>
        <td>${slot.startTime} - ${slot.endTime}</td>
        <td>${slot.topic}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h2 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #333; padding: 10px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <h2>Guru Aanklan Academy - Teacher Timetable</h2>
      <p><strong>Teacher:</strong> ${teacherName}</p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Day</th>
            <th>Batch</th>
            <th>Time</th>
            <th>Topic</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;
};

const getBatchPDFHtml = (batchName, slots) => {
  const rows = slots.map(slot => {
    const date = new Date(slot.date);
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    return `
      <tr>
        <td>${dateStr}</td>
        <td>${day}</td>
        <td>${slot.teacher?.name || 'N/A'}</td>
        <td>${slot.topic}</td>
        <td>${slot.startTime} - ${slot.endTime}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h2 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #333; padding: 10px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
      </style>
    </head>
    <body>
      <h2>Guru Aanklan Academy - Batch Timetable</h2>
      <p><strong>Batch:</strong> ${batchName}</p>
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
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;
};

const generateTeacherPDF = async (teacherId) => {
  try {
    const slots = await TimeSlot.find({ teacher: teacherId })
      .populate('teacher batch')
      .sort({ date: 1, startTime: 1 });

    if (slots.length === 0) {
      throw new Error('No slots found for this teacher');
    }

    const teacherName = slots[0].teacher.name;
    const html = getTeacherPDFHtml(teacherName, slots);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', margin: { top: 20, bottom: 20, left: 10, right: 10 } });
    await browser.close();

    return pdf;
  } catch (error) {
    logger.error('Error generating teacher PDF:', error.message);
    throw error;
  }
};

const generateBatchPDF = async (batchId) => {
  try {
    const slots = await TimeSlot.find({ batch: batchId })
      .populate('teacher batch')
      .sort({ date: 1, startTime: 1 });

    if (slots.length === 0) {
      throw new Error('No slots found for this batch');
    }

    const batchName = slots[0].batch.name;
    const html = getBatchPDFHtml(batchName, slots);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', margin: { top: 20, bottom: 20, left: 10, right: 10 } });
    await browser.close();

    return pdf;
  } catch (error) {
    logger.error('Error generating batch PDF:', error.message);
    throw error;
  }
};

module.exports = { generateTeacherPDF, generateBatchPDF };
