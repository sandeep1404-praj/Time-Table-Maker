const express = require('express');
const archiver = require('archiver');
const Teacher = require('../models/Teacher');
const Batch = require('../models/Batch');
const { generateTeacherPDF, generateBatchPDF } = require('../services/pdfService');
const logger = require('../config/logger');

const router = express.Router();

router.get('/teacher/:id/pdf', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const pdf = await generateTeacherPDF(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${teacher.name}-timetable.pdf"`);
    res.send(pdf);
    logger.info(`Generated PDF for teacher: ${teacher.name}`);
  } catch (error) {
    logger.error('Error in GET /export/teacher/:id/pdf:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/batch/:id/pdf', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    const pdf = await generateBatchPDF(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${batch.name}-timetable.pdf"`);
    res.send(pdf);
    logger.info(`Generated PDF for batch: ${batch.name}`);
  } catch (error) {
    logger.error('Error in GET /export/batch/:id/pdf:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/all-pdfs', async (req, res) => {
  try {
    const teachers = await Teacher.find();
    const batches = await Batch.find();

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="academy-timetables.zip"');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const teacher of teachers) {
      try {
        const pdf = await generateTeacherPDF(teacher._id);
        archive.append(pdf, { name: `teachers/${teacher.name}-timetable.pdf` });
        logger.info(`Added teacher PDF to zip: ${teacher.name}`);
      } catch (error) {
        logger.warn(`Failed to generate PDF for teacher ${teacher.name}:`, error.message);
      }
    }

    for (const batch of batches) {
      try {
        const pdf = await generateBatchPDF(batch._id);
        archive.append(pdf, { name: `batches/${batch.name}-timetable.pdf` });
        logger.info(`Added batch PDF to zip: ${batch.name}`);
      } catch (error) {
        logger.warn(`Failed to generate PDF for batch ${batch.name}:`, error.message);
      }
    }

    await archive.finalize();
    logger.info('Generated all-pdfs zip');
  } catch (error) {
    logger.error('Error in GET /export/all-pdfs:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
