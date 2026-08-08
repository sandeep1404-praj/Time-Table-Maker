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
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Helper: sanitize a user-controlled ID to prevent path-traversal in filenames.
const safeId = (id) => String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);

router.get(
  "/teacher/:id/pdf",
  asyncHandler(async (req, res) => {
    const buffer = await exportTeacherPdf(safeId(req.params.id));
    if (!buffer) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=\"teacher.pdf\"");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(buffer);
  })
);

router.get(
  "/batch/:id/pdf",
  asyncHandler(async (req, res) => {
    const buffer = await exportBatchPdf(safeId(req.params.id));
    if (!buffer) {
      return res.status(404).json({ error: "Batch not found" });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=\"batch.pdf\"");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(buffer);
  })
);

router.get(
  "/master/pdf",
  asyncHandler(async (req, res) => {
    const buffer = await exportMasterPdf();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=\"master.pdf\"");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(buffer);
  })
);

router.get(
  "/teacher/:id/docx",
  asyncHandler(async (req, res) => {
    const buffer = await exportTeacherDocx(safeId(req.params.id));
    if (!buffer) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=\"teacher.docx\"");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(buffer);
  })
);

router.get(
  "/batch/:id/docx",
  asyncHandler(async (req, res) => {
    const buffer = await exportBatchDocx(safeId(req.params.id));
    if (!buffer) {
      return res.status(404).json({ error: "Batch not found" });
    }
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=\"batch.docx\"");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(buffer);
  })
);

router.get(
  "/master/docx",
  asyncHandler(async (req, res) => {
    const buffer = await exportMasterDocx();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=\"master-timetable.docx\"");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(buffer);
  })
);

router.get(
  "/all-pdfs",
  asyncHandler(async (req, res) => {
    await exportAllPdfs(res);
  })
);

export default router;
