const dotenv = require("dotenv");
const { connectDb } = require("./config/db");
const Teacher = require("./models/Teacher");
const Branch = require("./models/Branch");
const Batch = require("./models/Batch");
const TimeSlot = require("./models/TimeSlot");
const DateRow = require("./models/DateRow");
const Archive = require("./models/Archive");
const ConflictLog = require("./models/ConflictLog");

dotenv.config();

const seed = async () => {
  await connectDb();
  await Teacher.deleteMany({});
  await Branch.deleteMany({});
  await Batch.deleteMany({});
  await TimeSlot.deleteMany({});
  await DateRow.deleteMany({});
  await Archive.deleteMany({});
  await ConflictLog.deleteMany({});

  // Branches
  const branches = await Branch.insertMany([
    { name: "Bhandup" },
    { name: "Powai" },
    { name: "Thane" },
    { name: "GHK" },
    { name: "DB" }
  ]);

  // Batches
  const batches = await Batch.insertMany([
    { name: "12th NEET", branch: branches[0]._id },
    { name: "12th NI", branch: branches[1]._id },
    { name: "11th NEET", branch: branches[2]._id },
    { name: "11th JEE", branch: branches[3]._id },
    { name: "12th JEE", branch: branches[4]._id }
  ]);

  // Teachers with subjects, some chapters and one teacher allowing overlap
  const teachers = await Teacher.insertMany([
    {
      name: "PSb Sir",
      code: "PSB",
      subject: "Physics",
      chapters: [
        {
          chapterNumber: "1",
          title: "Mechanics",
          plannedHours: 12,
          branchCompletions: [{ branch: branches[0]._id, isCompleted: false }],
          batchCompletions: [{ branch: branches[0]._id, batch: batches[0]._id, isCompleted: false }]
        }
      ]
    },
    { name: "RJ Sir", code: "RJ", subject: "Chemistry" },
    { name: "MK Maam", code: "MK", subject: "Biology" },
    { name: "AS Sir", code: "AS", subject: "Mathematics", allowScheduleOverlap: true },
    { name: "NP Sir", code: "NP", subject: "English" }
  ]);

  // Dates: create two weeks — one archived week and one current week
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday

  const addDays = (date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    next.setHours(0, 0, 0, 0);
    return next;
  };

  // archived week (previous week)
  const archivedStart = addDays(startOfWeek, -7);
  const archivedDateRows = Array.from({ length: 7 }, (_, i) => ({ date: addDays(archivedStart, i) }));
  const insertedArchived = await DateRow.insertMany(
    archivedDateRows.map((d) => ({ ...d }))
  );

  // current week
  const currentDateRows = Array.from({ length: 7 }, (_, i) => ({ date: addDays(startOfWeek, i) }));
  const insertedCurrent = await DateRow.insertMany(currentDateRows.map((d) => ({ ...d })));

  // Create an archive record for the previous week and mark archived rows
  const archive = await Archive.create({
    name: "Week Archive - previous",
    startDate: insertedArchived[0].date,
    endDate: insertedArchived[insertedArchived.length - 1].date
  });

  // mark archived date rows
  await DateRow.updateMany({ _id: { $in: insertedArchived.map((d) => d._id) } }, { isArchived: true, archiveId: archive._id });

  // Time blocks for slots
  const timeBlocks = [
    { start: "08:30", end: "10:30" },
    { start: "10:45", end: "12:45" },
    { start: "13:30", end: "15:30" },
    { start: "16:00", end: "18:00" }
  ];

  const slots = [];

  // Helper to push a slot
  const pushSlot = (date, startTime, endTime, teacherId, batchId, extras = {}) => {
    slots.push({
      date,
      startTime,
      endTime,
      teacher: teacherId || null,
      batch: batchId,
      topic: extras.topic || "Sample Topic",
      slotType: extras.slotType || "lecture",
      status: extras.status || "scheduled",
      notes: extras.notes || "",
      isArchived: extras.isArchived || false,
      archiveId: extras.archiveId || null
    });
  };

  // Create normal slots for current week
  insertedCurrent.forEach((dateRow, dIdx) => {
    // for each batch create one normal lecture
    batches.forEach((batch, bIdx) => {
      const teacher = teachers[bIdx % teachers.length];
      const block = timeBlocks[(dIdx + bIdx) % timeBlocks.length];
      pushSlot(dateRow.date, block.start, block.end, teacher._id, batch._id, {
        topic: `${batch.name} — Chapter ${(dIdx % 5) + 1}`
      });
    });
  });

  // Add deliberate teacher overlap: same teacher assigned overlapping slots on same date
  const conflictDate = insertedCurrent[1].date; // Tuesday
  // slot A
  pushSlot(conflictDate, "09:00", "11:00", teachers[0]._id, batches[0]._id, {
    topic: "Overlap A",
    slotType: "lecture"
  });
  // slot B overlapping same teacher
  pushSlot(conflictDate, "10:30", "12:00", teachers[0]._id, batches[1]._id, {
    topic: "Overlap B",
    slotType: "lecture"
  });

  // Add deliberate batch overlap: same batch with two teachers at overlapping times
  const batchConflictDate = insertedCurrent[2].date; // Wednesday
  pushSlot(batchConflictDate, "08:30", "10:30", teachers[1]._id, batches[2]._id, {
    topic: "Batch Overlap A"
  });
  pushSlot(batchConflictDate, "09:45", "11:15", teachers[2]._id, batches[2]._id, {
    topic: "Batch Overlap B"
  });

  // Add some tests and completed/cancelled slots
  pushSlot(insertedCurrent[0].date, "14:00", "16:00", teachers[3]._id, batches[3]._id, {
    topic: "Unit Test 1",
    slotType: "test",
    status: "completed",
    notes: "MCQ test held",
    completedAt: new Date()
  });

  pushSlot(insertedCurrent[3].date, "16:00", "17:30", teachers[4]._id, batches[4]._id, {
    topic: "Cancelled Session",
    status: "canceled",
    cancelNote: "Teacher absent"
  });

  // Archived slots for previous week to test history
  insertedArchived.forEach((dateRow, idx) => {
    const teacher = teachers[idx % teachers.length];
    const batch = batches[idx % batches.length];
    pushSlot(dateRow.date, "08:30", "10:30", teacher._id, batch._id, {
      topic: "Archived slot",
      isArchived: true,
      archiveId: archive._id
    });
  });

  // Insert all slots
  const insertedSlots = await TimeSlot.insertMany(slots);

  // Create ConflictLog entries for the deliberate overlaps
  const findSlot = (predicate) => insertedSlots.find(predicate);
  const overlapA = findSlot((s) => s.topic === "Overlap A");
  const overlapB = findSlot((s) => s.topic === "Overlap B");
  const batchA = findSlot((s) => s.topic === "Batch Overlap A");
  const batchB = findSlot((s) => s.topic === "Batch Overlap B");

  const conflictDocs = [];
  if (overlapA && overlapB) {
    conflictDocs.push({ slot1: overlapA._id, slot2: overlapB._id });
  }
  if (batchA && batchB) {
    conflictDocs.push({ slot1: batchA._id, slot2: batchB._id });
  }

  if (conflictDocs.length > 0) {
    await ConflictLog.insertMany(conflictDocs);
  }

  console.log("Seed data inserted: branches, batches, teachers, dates, slots, archive, conflicts");
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
