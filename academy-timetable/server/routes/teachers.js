const express = require("express");
const Teacher = require("../models/Teacher");

const router = express.Router();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.get("/", async (req, res) => {
  const filter = {};
  const search = req.query.search?.trim();
  if (search) {
    filter.name = { $regex: escapeRegex(search), $options: "i" };
  }
  const teachers = await Teacher.find(filter).sort({ name: 1 });
  res.json(teachers);
});

router.post("/", async (req, res) => {
  const { name, code, subject, chapters, color, allowScheduleOverlap } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: "Teacher name is required" });
  }
  if (!subject?.trim()) {
    return res.status(400).json({ error: "Subject is required" });
  }

  const trimmedName = name.trim();
  const existing = await Teacher.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i") }
  });
  if (existing) {
    return res.status(409).json({ error: "Teacher name already exists" });
  }

  const base = (name.match(/[A-Za-z]+/g) || [])
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "T";
  let finalCode = code?.trim();
  if (!finalCode) {
    finalCode = base;
    let counter = 1;
    while (await Teacher.exists({ code: finalCode })) {
      finalCode = `${base}${counter}`;
      counter += 1;
    }
  }

  const normalizedChapters = Array.isArray(chapters)
    ? chapters.map((chapter) => ({
        chapterNumber: String(chapter?.chapterNumber || "").trim(),
        title: String(chapter?.title || "").trim(),
        plannedHours: Number(chapter?.plannedHours || 0)
      }))
    : [];

  const fallbackColor = `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0")}`;

  const teacher = await Teacher.create({
    name: trimmedName,
    code: finalCode,
    subject: subject?.trim() || "",
    chapters: normalizedChapters,
    color: color?.trim() || fallbackColor,
    allowScheduleOverlap: Boolean(allowScheduleOverlap)
  });
  res.status(201).json(teacher);
});

router.patch("/:id", async (req, res) => {
  const { name, subject, allowScheduleOverlap } = req.body;
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher not found" });
  }

  if (name !== undefined) {
    if (!String(name).trim()) {
      return res.status(400).json({ error: "Teacher name is required" });
    }
    const trimmedName = String(name).trim();
    const duplicate = await Teacher.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, "i") },
      _id: { $ne: req.params.id }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Teacher name already exists" });
    }
    teacher.name = trimmedName;
  }

  if (subject !== undefined) {
    if (!String(subject).trim()) {
      return res.status(400).json({ error: "Subject is required" });
    }
    teacher.subject = String(subject).trim();
  }

  if (allowScheduleOverlap !== undefined) {
    teacher.allowScheduleOverlap = Boolean(allowScheduleOverlap);
  }

  await teacher.save();
  res.json(teacher);
});

router.patch("/:id/chapters/:chapterId", async (req, res) => {
  const { chapterNumber, title, plannedHours } = req.body;
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher not found" });
  }

  const chapter = teacher.chapters.id(req.params.chapterId);
  if (!chapter) {
    return res.status(404).json({ error: "Chapter not found" });
  }

  if (chapterNumber !== undefined) {
    if (!String(chapterNumber).trim()) {
      return res.status(400).json({ error: "Chapter number is required" });
    }
    chapter.chapterNumber = String(chapterNumber).trim();
  }
  if (title !== undefined) {
    chapter.title = String(title).trim();
  }
  if (plannedHours !== undefined) {
    chapter.plannedHours = Number(plannedHours || 0);
  }

  await teacher.save();
  res.json(teacher);
});

router.delete("/:id/chapters/:chapterId", async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher not found" });
  }

  const chapter = teacher.chapters.id(req.params.chapterId);
  if (!chapter) {
    return res.status(404).json({ error: "Chapter not found" });
  }

  chapter.deleteOne();
  await teacher.save();
  res.json(teacher);
});

router.delete("/:id", async (req, res) => {
  const teacher = await Teacher.findByIdAndDelete(req.params.id);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher not found" });
  }
  res.json({ status: "deleted" });
});

router.patch("/:id/chapters", async (req, res) => {
  const { chapterNumber, title, plannedHours } = req.body;
  if (!chapterNumber) {
    return res.status(400).json({ error: "Chapter number is required" });
  }

  const chapter = {
    chapterNumber: String(chapterNumber).trim(),
    title: String(title || "").trim(),
    plannedHours: Number(plannedHours || 0)
  };

  const teacher = await Teacher.findByIdAndUpdate(
    req.params.id,
    { $push: { chapters: chapter } },
    { new: true }
  );

  if (!teacher) {
    return res.status(404).json({ error: "Teacher not found" });
  }

  res.json(teacher);
});

module.exports = router;
