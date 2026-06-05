const dotenv = require("dotenv");
const { connectDb } = require("./config/db");
const Teacher = require("./models/Teacher");
const Branch = require("./models/Branch");
const Batch = require("./models/Batch");
const TimeSlot = require("./models/TimeSlot");
const DateRow = require("./models/DateRow");

dotenv.config();

const seed = async () => {
  await connectDb();
  await Teacher.deleteMany({});
  await Branch.deleteMany({});
  await Batch.deleteMany({});
  await TimeSlot.deleteMany({});
  await DateRow.deleteMany({});

  const teachers = await Teacher.insertMany([
    { name: "PSb Sir", code: "PSb" },
    { name: "RJ Sir", code: "RJ" },
    { name: "MK Maam", code: "MK" },
    { name: "AS Sir", code: "AS" },
    { name: "NP Sir", code: "NP" },
    { name: "DK Maam", code: "DK" },
    { name: "VJ Sir", code: "VJ" },
    { name: "SM Maam", code: "SM" },
    { name: "KT Sir", code: "KT" },
    { name: "RL Maam", code: "RL" }
  ]);

  const branches = await Branch.insertMany([
    { name: "Bhandup" },
    { name: "Powai" },
    { name: "Thane" },
    { name: "GHK" },
    { name: "DB" }
  ]);

  const batches = await Batch.insertMany([
    { name: "12th NEET", branch: branches[0]._id },
    { name: "12th NI", branch: branches[1]._id },
    { name: "11th NEET", branch: branches[2]._id },
    { name: "11th JEE", branch: branches[3]._id },
    { name: "12th JEE", branch: branches[4]._id },
    { name: "10th Foundation", branch: branches[0]._id },
    { name: "9th Foundation", branch: branches[1]._id },
    { name: "12th NEET", branch: branches[2]._id },
    { name: "11th JEE", branch: branches[3]._id },
    { name: "10th Foundation", branch: branches[4]._id }
  ]);

  const startDate = new Date("2026-05-18");
  const addDays = (date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  };

  const dateRows = Array.from({ length: 7 }, (_, index) => ({
    date: addDays(startDate, index)
  }));
  await DateRow.insertMany(dateRows);

  const slots = [];
  const timeBlocks = [
    { start: "08:00", end: "10:00" },
    { start: "10:30", end: "12:30" },
    { start: "13:00", end: "15:00" },
    { start: "15:30", end: "17:00" }
  ];

  batches.forEach((batch, batchIndex) => {
    const teacher = teachers[batchIndex % teachers.length];
    for (let i = 0; i < 7; i += 1) {
      const date = dateRows[i].date;
      const block = timeBlocks[i % timeBlocks.length];
      slots.push({
        date,
        startTime: block.start,
        endTime: block.end,
        teacher: teacher._id,
        batch: batch._id,
        topic: `Topic ${i + 1}`,
        slotType: i % 5 === 0 ? "test" : "lecture"
      });
    }
  });

  await TimeSlot.insertMany(slots);

  console.log("Seed data inserted");
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
