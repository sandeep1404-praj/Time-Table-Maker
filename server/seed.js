require('dotenv').config();
const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const Branch = require('./models/Branch');
const Batch = require('./models/Batch');
const TimeSlot = require('./models/TimeSlot');
const logger = require('./config/logger');

const seedDatabase = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/academy-timetable';
    await mongoose.connect(uri);
    logger.info('Connected to MongoDB');

    await TimeSlot.deleteMany({});
    await Batch.deleteMany({});
    await Branch.deleteMany({});
    await Teacher.deleteMany({});
    logger.info('Cleared existing data');

    const teachers = await Teacher.insertMany([
      { name: 'PSb Sir', code: 'PSb' },
      { name: 'Amit Sir', code: 'AM' },
      { name: 'Priya Ma\'am', code: 'PR' },
      { name: 'Rajesh Sir', code: 'RJ' },
      { name: 'Neha Ma\'am', code: 'NH' },
    ]);
    logger.info('Seeded 5 teachers');

    const branches = await Branch.insertMany([
      { name: 'Bhandup' },
      { name: 'Powai' },
      { name: 'Thane' },
    ]);
    logger.info('Seeded 3 branches');

    const batches = await Batch.insertMany([
      { name: '12th NEET', branch: branches[0]._id },
      { name: '12th NI', branch: branches[0]._id },
      { name: '11th NEET', branch: branches[1]._id },
      { name: '12th NEET', branch: branches[1]._id },
      { name: 'JEE Advanced', branch: branches[2]._id },
    ]);
    logger.info('Seeded 5 batches');

    const startDate = new Date('2026-05-18');
    const slots = [];
    for (let i = 0; i < 10; i++) {
      slots.push({
        date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
        startTime: '08:00',
        endTime: '10:30',
        teacher: teachers[i % teachers.length]._id,
        batch: batches[i % batches.length]._id,
        topic: `Chapter ${i + 1}`,
        slotType: i % 3 === 0 ? 'test' : 'lecture',
        notes: i % 5 === 0 ? 'Special session' : '',
      });
    }
    await TimeSlot.insertMany(slots);
    logger.info('Seeded 10 time slots');

    logger.info('Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
