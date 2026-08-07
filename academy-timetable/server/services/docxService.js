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

const formatDate = (date) => new Date(date).toISOString().slice(0, 10);
const getDay = (date) => new Date(date).toLocaleDateString("en-IN", { weekday: "short" });

const createCell = ({
  text = "",
  bold = false,
  shading = null,
  align = AlignmentType.LEFT,
  fontSize = 18,
  paragraphs = null
}) =>
  new TableCell({
    borders: cellBorders,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
    shading: shading
      ? { type: ShadingType.CLEAR, color: "auto", fill: shading }
      : undefined,
    children:
      paragraphs || [
        new Paragraph({
          alignment: align,
          children: [new TextRun({ text: String(text), bold, size: fontSize, font: "Arial" })]
        })
      ]
  });

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CFCFCF" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CFCFCF" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CFCFCF" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CFCFCF" }
};

const buildTeacherTable = (slots) => {
  const header = new TableRow({
    children: [
      createCell({ text: "Date", bold: true }),
      createCell({ text: "Day", bold: true }),
      createCell({ text: "Branch", bold: true }),
      createCell({ text: "Time", bold: true }),
      createCell({ text: "Topic", bold: true })
    ]
  });

  const rows = slots.map((slot) =>
    new TableRow({
      children: [
        createCell({ text: formatDate(slot.date) }),
        createCell({ text: getDay(slot.date) }),
        createCell({ text: slot.batch?.branch?.name || "" }),
        createCell({ text: `${formatTimeForDisplay(slot.startTime)}-${formatTimeForDisplay(slot.endTime)}` }),
        createCell({ text: slot.topic || "" })
      ]
    })
  );

  return new Table({ rows: [header, ...rows] });
};

const buildBatchTable = (slots) => {
  const header = new TableRow({
    children: [
      createCell({ text: "Date", bold: true }),
      createCell({ text: "Day", bold: true }),
      createCell({ text: "Faculty", bold: true }),
      createCell({ text: "Chapter", bold: true }),
      createCell({ text: "Time", bold: true })
    ]
  });

  const rows = slots.map((slot) =>
    new TableRow({
      children: [
        createCell({ text: formatDate(slot.date) }),
        createCell({ text: getDay(slot.date) }),
        createCell({ text: slot.teacher?.name || "" }),
        createCell({ text: slot.topic || "" }),
        createCell({ text: `${formatTimeForDisplay(slot.startTime)}-${formatTimeForDisplay(slot.endTime)}` })
      ]
    })
  );

  return new Table({ rows: [header, ...rows] });
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
          new Paragraph({ text: "Guru Aanklan Academy", heading: "Heading1" }),
          new Paragraph({ text: `${teacher.name} - Weekly Timetable`, heading: "Heading2" }),
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

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "Guru Aanklan Academy", heading: "Heading1" }),
          new Paragraph({
            text: `${batch.branch?.name || ""} ${batch.name} - Weekly Timetable`,
            heading: "Heading2"
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
  const batches = await Batch.find().populate("branch");
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
