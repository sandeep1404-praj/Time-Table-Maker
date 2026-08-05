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

const buildMasterTable = (slots, batches) => {
  const dates = Array.from(
    new Set(slots.map((slot) => formatDate(slot.date)))
  ).sort();

  const dateColumnWidth = 9;
  const batchColumnWidth = Math.max(4, Math.floor((100 - dateColumnWidth) / batches.length));

  const header = new TableRow({
    children: [
      createCell({
        text: "Date",
        bold: true,
        shading: "F2F2F2",
        align: AlignmentType.CENTER,
        fontSize: 18
      }),
      ...batches.map((batch) =>
        createCell({
          text: `${batch.branch?.name || ""} ${batch.name}`,
          bold: true,
          shading: "F2F2F2",
          align: AlignmentType.CENTER,
          fontSize: 18
        })
      )
    ]
  });

  const rows = dates.map((date) => {
    const rowCells = [
      createCell({
        text: date,
        bold: true,
        shading: "F2F2F2",
        align: AlignmentType.CENTER,
        fontSize: 18
      })
    ];
    batches.forEach((batch) => {
      const cellSlots = slots.filter(
        (slot) =>
          formatDate(slot.date) === date &&
          String(slot.batch?._id) === String(batch._id)
      );
      const paragraphs = cellSlots.length
        ? cellSlots.map((slot) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: `${formatTimeForDisplay(slot.startTime)}-${formatTimeForDisplay(slot.endTime)} ${slot.topic || ""}`,
                  size: 18,
                  font: "Arial"
                })
              ]
            })
          )
        : [new Paragraph("")];
      rowCells.push(
        createCell({
          paragraphs,
          fontSize: 18,
          align: AlignmentType.LEFT
        })
      );
    });
    return new TableRow({ children: rowCells });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: cellBorders,
    columnWidths: [
      dateColumnWidth * 50,
      ...batches.map(() => batchColumnWidth * 50)
    ],
    rows: [header, ...rows]
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
    await TimeSlot.find()
      .populate("teacher")
      .populate({ path: "batch", populate: "branch" })
  );
  const batches = await Batch.find().populate("branch").sort({ name: 1 });
  const dateRows = await DateRow.find().sort({ date: 1 });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: { top: 720, bottom: 720, left: 720, right: 720 }
          }
        },
        children: [
          new Paragraph({ text: "Guru Aanklan Academy", heading: "Heading1" }),
          new Paragraph({ text: "Master Timetable", heading: "Heading2" }),
          buildMasterTable(
            [...slots, ...dateRows.map((row) => ({ date: row.date, batch: null }))],
            batches
          )
        ]
      }
    ]
  });

  return Packer.toBuffer(doc);
};

export { exportBatchDocx, exportMasterDocx, exportTeacherDocx };
