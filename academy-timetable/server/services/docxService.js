import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  ShadingType,
  AlignmentType,
  BorderStyle,
  PageOrientation,
  TableLayoutType,
  VerticalAlign
} from "docx";
import TimeSlot from "../models/TimeSlot.js";
import Teacher from "../models/Teacher.js";
import Batch from "../models/Batch.js";
import DateRow from "../models/DateRow.js";
import { formatTimeForDisplay, sortSlotsByDateAndTime } from "../utils/time.js";
import { sortBatchesByOrder } from "../utils/batchOrder.js";

const formatDate = (date) => new Date(date).toISOString().slice(0, 10);
const getDayFull = (date) =>
  new Date(date).toLocaleDateString("en-IN", { weekday: "long" });
const formatDisplayDate = (dateStr) => {
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
};

const BT_CELL_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
};

const SLOT_TYPE_LABEL = {
  "lecture": "Lecture (Theory)",
  "lecture-theory": "Lecture (Theory)",
  "lecture-mcq": "Lecture (MCQ)",
  "test": "Test",
  "mcq": "MCQ",
  "revision": "Revision",
  "coverup": "Coverup"
};

const btCell = (text, { bold = false, shading = null, fontSize = 18, align = AlignmentType.CENTER, rowSpan = undefined } = {}) =>
  new TableCell({
    borders: BT_CELL_BORDERS,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    rowSpan,
    shading: shading ? { type: ShadingType.CLEAR, color: "auto", fill: shading } : undefined,
    children: [
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text: String(text), bold, size: fontSize, font: "Calibri" })]
      })
    ]
  });

// --- BATCH TABLE ---
const buildBatchTable = (slots) => {
  const HEADER_SHADING = "FFD600"; // Yellow

  const header = new TableRow({
    children: [
      btCell("Date", { bold: true, shading: HEADER_SHADING }),
      btCell("Day", { bold: true, shading: HEADER_SHADING }),
      btCell("Faculty", { bold: true, shading: HEADER_SHADING }),
      btCell("Chapter", { bold: true, shading: HEADER_SHADING }),
      btCell("Time", { bold: true, shading: HEADER_SHADING }),
      btCell("Type", { bold: true, shading: HEADER_SHADING }),
      btCell("Topic", { bold: true, shading: HEADER_SHADING })
    ]
  });

  // Group by date
  const groups = [];
  const seen = new Map();
  slots.forEach((slot) => {
    const key = formatDate(slot.date);
    if (!seen.has(key)) { seen.set(key, []); groups.push({ key, slots: seen.get(key) }); }
    seen.get(key).push(slot);
  });

  const rows = groups.flatMap(({ key, slots: groupSlots }) =>
    groupSlots.map((slot, idx) => {
      const chapter = (() => {
        if (!slot.chapterNumber) return "—";
        const ch = slot.teacher?.chapters?.find(
          (c) => String(c.chapterNumber) === String(slot.chapterNumber)
        );
        return ch?.title ? `Ch. ${slot.chapterNumber} – ${ch.title}` : `Ch. ${slot.chapterNumber}`;
      })();
      const typeLabel = SLOT_TYPE_LABEL[slot.slotType] || slot.slotType || "Lecture (Theory)";
      const timeStr = `${formatTimeForDisplay(slot.startTime)} to ${formatTimeForDisplay(slot.endTime)}`;

      const cells = [];
      if (idx === 0) {
        cells.push(btCell(formatDisplayDate(key), { bold: true, rowSpan: groupSlots.length }));
        cells.push(btCell(getDayFull(key), { bold: true, rowSpan: groupSlots.length }));
      }
      cells.push(btCell(slot.teacher?.name || ""));
      cells.push(btCell(chapter, { align: AlignmentType.LEFT }));
      cells.push(btCell(timeStr));
      cells.push(btCell(typeLabel));
      cells.push(btCell(slot.topic || "", { align: AlignmentType.LEFT }));

      return new TableRow({ children: cells });
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows]
  });
};

// --- TEACHER TABLE ---
const buildTeacherTable = (slots) => {
  const HEADER_SHADING = "FFD600";

  const header = new TableRow({
    children: [
      btCell("Date", { bold: true, shading: HEADER_SHADING }),
      btCell("Day", { bold: true, shading: HEADER_SHADING }),
      btCell("Branch", { bold: true, shading: HEADER_SHADING }),
      btCell("Topic", { bold: true, shading: HEADER_SHADING }),
      btCell("Time", { bold: true, shading: HEADER_SHADING })
    ]
  });

  const groups = [];
  const seen = new Map();
  slots.forEach((slot) => {
    const key = formatDate(slot.date);
    if (!seen.has(key)) { seen.set(key, []); groups.push({ key, slots: seen.get(key) }); }
    seen.get(key).push(slot);
  });

  const rows = groups.flatMap(({ key, slots: groupSlots }) =>
    groupSlots.map((slot, idx) => {
      const timeStr = `${formatTimeForDisplay(slot.startTime)} to ${formatTimeForDisplay(slot.endTime)}`;
      const cells = [];
      if (idx === 0) {
        cells.push(btCell(formatDisplayDate(key), { bold: true, rowSpan: groupSlots.length }));
        cells.push(btCell(getDayFull(key), { bold: true, rowSpan: groupSlots.length }));
      }
      cells.push(btCell(slot.batch?.branch?.name || ""));
      cells.push(btCell(slot.topic || "", { align: AlignmentType.LEFT }));
      cells.push(btCell(timeStr));
      return new TableRow({ children: cells });
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows]
  });
};


const THIN_BORDER = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const CELL_BORDERS_THIN = {
  top: THIN_BORDER,
  bottom: THIN_BORDER,
  left: THIN_BORDER,
  right: THIN_BORDER
};

// Minimal cell margins matching reference (96 dxa left/right, no top/bottom)
const REF_CELL_MARGINS = { top: 0, bottom: 0, left: 96, right: 96 };

const makeRun = (text, { size = 14, bold = false, font = "Calibri" } = {}) =>
  new TextRun({ text: String(text), size, bold, font });

const makePara = (runs, { align = AlignmentType.CENTER, spacingAfter = 0 } = {}) =>
  new Paragraph({
    alignment: align,
    spacing: { after: spacingAfter, before: 0 },
    children: Array.isArray(runs) ? runs : [runs]
  });

const makeCell = (paragraphs, { width, shading = null, vAlign = VerticalAlign.CENTER } = {}) =>
  new TableCell({
    borders: CELL_BORDERS_THIN,
    verticalAlign: vAlign,
    margins: REF_CELL_MARGINS,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: shading ? { type: ShadingType.CLEAR, color: "auto", fill: shading } : undefined,
    children: paragraphs
  });

const formatDateDisplay = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const getDayName = (date) =>
  new Date(date).toLocaleDateString("en-IN", { weekday: "long" });

const buildMasterTable = (slots, batches, extraDates = []) => {
  // Collect all date keys: from slots + extra date rows
  const dateSet = new Set([
    ...slots.map((s) => formatDate(s.date)),
    ...extraDates.map((d) => formatDate(d))
  ]);
  const dates = Array.from(dateSet).sort();

  // Column widths matching reference — distribute remainder to last batch column
  const DATE_COL_W = 1129; // dxa — matches reference date column
  const TABLE_TOTAL_W = 23690; // dxa — matches reference total width
  const batchColW = batches.length
    ? Math.floor((TABLE_TOTAL_W - DATE_COL_W) / batches.length)
    : 900;
  // Give any leftover twips to the last batch column so table fills exactly
  const lastBatchColW = batches.length
    ? TABLE_TOTAL_W - DATE_COL_W - batchColW * (batches.length - 1)
    : batchColW;

  // === HEADER ROW ===
  // Date cell header: "Date" in 18pt bold, center
  const dateHeaderCell = makeCell(
    [makePara(makeRun("Date", { size: 18, bold: true }))],
    { width: DATE_COL_W, shading: "D9D9D9" }
  );

  // Batch header cells: branch name (small) + batch name (main) multiline, 20pt
  const batchHeaderCells = batches.map((batch, idx) =>
    makeCell(
      [
        makePara(makeRun(batch.branch?.name || "", { size: 14 })),
        makePara(makeRun(batch.name, { size: 20, bold: false }))
      ],
      { width: idx === batches.length - 1 ? lastBatchColW : batchColW, shading: "D9D9D9" }
    )
  );

  const headerRow = new TableRow({
    tableHeader: true,
    children: [dateHeaderCell, ...batchHeaderCells]
  });

  // === DATA ROWS ===
  const dataRows = dates.map((date) => {
    const dayName = getDayName(date);
    const dateDisplay = (() => {
      const [y, m, d] = date.split("-");
      return `${d}/${m}/${y}`;
    })();

    // Date cell: Day name (18pt) + date (18pt) stacked, left-aligned
    const dateCellParas = [
      makePara(makeRun(dayName, { size: 18, bold: false }), { align: AlignmentType.LEFT }),
      makePara(makeRun(dateDisplay, { size: 18, bold: false }), { align: AlignmentType.LEFT })
    ];

    const dateCell = makeCell(dateCellParas, { width: DATE_COL_W, shading: "F2F2F2" });

    // Batch content cells
    const batchCells = batches.map((batch, idx) => {
      const cellSlots = slots.filter(
        (slot) =>
          slot.batch &&
          formatDate(slot.date) === date &&
          String(slot.batch?._id) === String(batch._id)
      );

      if (!cellSlots.length) {
        return makeCell([makePara(makeRun("", { size: 14 }))], {
          width: idx === batches.length - 1 ? lastBatchColW : batchColW
        });
      }

      const paras = cellSlots.flatMap((slot, slotIdx) => {
        const timeStr = `${formatTimeForDisplay(slot.startTime)}-${formatTimeForDisplay(slot.endTime)}`;
        const teacherName = slot.teacher?.name || "";
        const topic = slot.topic || "";
        const slotType = slot.slotType || "";

        const lines = [
          makePara(makeRun(timeStr, { size: 14 })),
          makePara(makeRun(teacherName, { size: 14, bold: false }))
        ];
        if (topic) lines.push(makePara(makeRun(topic, { size: 12 })));
        if (slotType === "test") {
          lines.push(makePara(makeRun("TEST", { size: 12, bold: true })));
        } else if (slotType === "lecture-mcq") {
          lines.push(makePara(makeRun("MCQ", { size: 12, bold: true })));
        }
        // Add empty line between multiple slots in the same cell
        if (slotIdx < cellSlots.length - 1) {
          lines.push(makePara(makeRun("", { size: 14 })));
        }
        return lines;
      });

      return makeCell(paras, { width: idx === batches.length - 1 ? lastBatchColW : batchColW });
    });

    return new TableRow({ children: [dateCell, ...batchCells] });
  });

  return new Table({
    width: { size: TABLE_TOTAL_W, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    columnWidths: [
      DATE_COL_W,
      ...batches.map((_, idx) =>
        idx === batches.length - 1 ? lastBatchColW : batchColW
      )
    ],
    rows: [headerRow, ...dataRows]
  });
};

const exportTeacherDocx = async (teacherId) => {
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) return null;

  const slots = sortSlotsByDateAndTime(
    await TimeSlot.find({ teacher: teacherId })
      .populate("teacher")
      .populate({ path: "batch", populate: "branch" })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: "Guru Aanklan Academy", bold: true, size: 28, font: "Calibri" })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "39BEF0" },
            children: [new TextRun({ text: teacher.name, bold: true, size: 24, font: "Calibri", color: "FFFFFF" })]
          }),
          buildTeacherTable(slots)
        ]
      }
    ]
  });

  return Packer.toBuffer(doc);
};

const exportBatchDocx = async (batchId) => {
  const batch = await Batch.findById(batchId).populate("branch");
  if (!batch) return null;

  const slots = sortSlotsByDateAndTime(
    await TimeSlot.find({ batch: batchId })
      .populate("teacher")
      .populate({ path: "batch", populate: "branch" })
  );

  const batchTitle = `${batch.branch?.name || ""} ${batch.name}`;
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: "Guru Aanklan Academy", bold: true, size: 28, font: "Calibri" })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            shading: { type: ShadingType.CLEAR, color: "auto", fill: "39BEF0" },
            children: [new TextRun({ text: batchTitle, bold: true, size: 24, font: "Calibri", color: "FFFFFF" })]
          }),
          buildBatchTable(slots)
        ]
      }
    ]
  });

  return Packer.toBuffer(doc);
};

const exportMasterDocx = async () => {
  const slots = sortSlotsByDateAndTime(
    await TimeSlot.find({ isArchived: { $ne: true } })
      .populate("teacher")
      .populate({ path: "batch", populate: "branch" })
  );
  const batches = sortBatchesByOrder(await Batch.find().populate("branch"));
  const dateRows = await DateRow.find().sort({ date: 1 });
  const extraDates = dateRows.map((row) => row.date);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            // The docx library swaps w/h when orientation=LANDSCAPE.
            // Pass portrait values (short edge as width) so the output XML
            // matches the reference: w:w="23814" w:h="16840" w:orient="landscape"
            // which gives a landscape page 23814 twips wide.
            size: {
              width: 16840,
              height: 23814,
              orientation: PageOrientation.LANDSCAPE
            },
            // Ultra-narrow margins matching reference (57 twips ≈ 1mm)
            margin: { top: 57, bottom: 57, left: 57, right: 57 }
          }
        },
        children: [buildMasterTable(slots, batches, extraDates)]
      }
    ]
  });

  return Packer.toBuffer(doc);
};

export { exportBatchDocx, exportMasterDocx, exportTeacherDocx };
