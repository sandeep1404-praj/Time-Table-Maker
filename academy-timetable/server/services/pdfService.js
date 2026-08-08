import archiver from "archiver";
import puppeteer from "puppeteer";
import TimeSlot from "../models/TimeSlot.js";
import Teacher from "../models/Teacher.js";
import Batch from "../models/Batch.js";
import DateRow from "../models/DateRow.js";
import { teacherTemplate } from "../templates/teacherTemplate.js";
import { batchTemplate } from "../templates/batchTemplate.js";
import { masterTemplate } from "../templates/masterTemplate.js";
import { sortSlotsByDateAndTime } from "../utils/time.js";

const formatDate = (date) => new Date(date).toISOString().slice(0, 10);

const renderPdfBuffer = async (html, landscape = false) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  const buffer = await page.pdf({
    width: landscape ? "420mm" : undefined,
    height: landscape ? "297mm" : undefined,
    format: landscape ? undefined : "A4",
    landscape,
    printBackground: true,
    margin: landscape ? { top: "4mm", bottom: "4mm", left: "4mm", right: "4mm" } : undefined
  });
  await browser.close();
  return buffer;
};

const exportTeacherPdf = async (teacherId) => {
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) return null;

  const slots = sortSlotsByDateAndTime(
    await TimeSlot.find({ teacher: teacherId })
      .populate({ path: "batch", populate: "branch" })
      .populate("teacher")
  );

  const html = teacherTemplate({
    teacherName: teacher.name,
    slots
  });

  return renderPdfBuffer(html);
};

const exportBatchPdf = async (batchId) => {
  const batch = await Batch.findById(batchId).populate("branch");
  if (!batch) return null;

  const slots = sortSlotsByDateAndTime(
    await TimeSlot.find({ batch: batchId })
      .populate("teacher")
      .populate({ path: "batch", populate: "branch" })
  );

  const html = batchTemplate({
    batchName: `${batch.branch?.name || ""} ${batch.name}`,
    slots
  });

  return renderPdfBuffer(html);
};

const exportAllPdfs = async (res) => {
  const archive = archiver("zip", { zlib: { level: 9 } });
  res.attachment("timetables.zip");
  archive.pipe(res);

  const teachers = await Teacher.find();
  for (const teacher of teachers) {
    const buffer = await exportTeacherPdf(teacher._id);
    if (buffer) {
      archive.append(buffer, { name: `teacher-${teacher.code}.pdf` });
    }
  }

  const batches = await Batch.find().populate("branch");
  for (const batch of batches) {
    const buffer = await exportBatchPdf(batch._id);
    if (buffer) {
      archive.append(buffer, { name: `batch-${batch.branch.name}-${batch.name}.pdf` });
    }
  }

  await archive.finalize();
};

const exportMasterPdf = async () => {
  const slots = sortSlotsByDateAndTime(
    await TimeSlot.find({ isArchived: { $ne: true } })
      .populate("teacher")
      .populate({ path: "batch", populate: "branch" })
  );
  // DB insertion order (same as web master grid and Word export)
  const batches = await Batch.find().populate("branch");
  const dateRows = await DateRow.find().sort({ date: 1 });
  const extraDates = dateRows.map((row) => row.date);

  const html = masterTemplate({ batches, slots, extraDates });

  // Render as A3 landscape to fit all batch columns
  return renderPdfBuffer(html, true);
};

export { exportAllPdfs, exportBatchPdf, exportMasterPdf, exportTeacherPdf };
