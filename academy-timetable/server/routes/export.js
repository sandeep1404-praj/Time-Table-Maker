import express from "express";
import {
  exportTeacherPdf,
  exportBatchPdf,
  exportAllPdfs,
  exportMasterPdf
} from "../services/pdfService.js";
import {
  exportTeacherDocx,
  exportBatchDocx,
  exportMasterDocx
} from "../services/docxService.js";

const router = express.Router();

router.get("/teacher/:id/pdf", async (req, res) => {
  const buffer = await exportTeacherPdf(req.params.id);
  if (!buffer) {
    return res.status(404).json({ error: "Teacher not found" });
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=teacher.pdf");
  res.send(buffer);
});

router.get("/batch/:id/pdf", async (req, res) => {
  const buffer = await exportBatchPdf(req.params.id);
  if (!buffer) {
    return res.status(404).json({ error: "Batch not found" });
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=batch.pdf");
  res.send(buffer);
});

router.get("/master/pdf", async (req, res) => {
  const buffer = await exportMasterPdf();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=master.pdf");
  res.send(buffer);
});

router.get("/teacher/:id/docx", async (req, res) => {
  const buffer = await exportTeacherDocx(req.params.id);
  if (!buffer) {
    return res.status(404).json({ error: "Teacher not found" });
  }
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.setHeader("Content-Disposition", "attachment; filename=teacher.docx");
  res.send(buffer);
});

router.get("/batch/:id/docx", async (req, res) => {
  const buffer = await exportBatchDocx(req.params.id);
  if (!buffer) {
    return res.status(404).json({ error: "Batch not found" });
  }
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.setHeader("Content-Disposition", "attachment; filename=batch.docx");
  res.send(buffer);
});

router.get("/master/docx", async (req, res) => {
  const buffer = await exportMasterDocx();
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.setHeader("Content-Disposition", "attachment; filename=master-timetable.docx");
  res.send(buffer);
});

router.get("/all-pdfs", async (req, res) => {
  await exportAllPdfs(res);
});

export default router;
