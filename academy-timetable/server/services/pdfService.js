import archiver from "archiver";
import puppeteer from "puppeteer";
import TimeSlot from "../models/TimeSlot.js";
import Teacher from "../models/Teacher.js";
import Batch from "../models/Batch.js";
import { teacherTemplate } from "../templates/teacherTemplate.js";
import { batchTemplate } from "../templates/batchTemplate.js";
import { masterTemplate } from "../templates/masterTemplate.js";
import { sortSlotsByDateAndTime } from "../utils/time.js";

const formatDate = (date) => new Date(date).toISOString().slice(0, 10);
const getDay = (date) => new Date(date).toLocaleDateString("en-IN", { weekday: "short" });

const buildTeacherRows = (slots) =>
  slots.map((slot) => ({
    date: formatDate(slot.date),
    day: getDay(slot.date),
    branch: slot.batch?.branch?.name || "",
    time: `${slot.startTime}-${slot.endTime}`,
    topic: slot.topic || ""
  }));

const buildBatchRows = (slots) =>
  slots.map((slot) => ({
    date: formatDate(slot.date),
    day: getDay(slot.date),
    faculty: slot.teacher?.name || "",
    chapter: slot.topic || "",
    time: `${slot.startTime}-${slot.endTime}`
  }));

const renderPdfBuffer = async (html) => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const buffer = await page.pdf({ format: "A4", printBackground: true });
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
    academyName: "Guru Aanklan Academy",
    teacherName: teacher.name,
    rows: buildTeacherRows(slots)
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
    academyName: "Guru Aanklan Academy",
    batchName: `${batch.branch.name} ${batch.name}`,
    rows: buildBatchRows(slots)
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
    await TimeSlot.find()
      .populate("teacher")
      .populate({ path: "batch", populate: "branch" })
  );
  const batches = await Batch.find().populate("branch").sort({ name: 1 });

  const html = masterTemplate({
    academyName: "Guru Aanklan Academy",
    batches,
    slots
  });

  return renderPdfBuffer(html);
};

export { exportAllPdfs, exportBatchPdf, exportMasterPdf, exportTeacherPdf };
