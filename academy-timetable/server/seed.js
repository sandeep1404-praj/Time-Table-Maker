import dotenv from "dotenv";
import { connectDb } from "./config/db.js";
import Branch from "./models/Branch.js";
import Batch from "./models/Batch.js";

dotenv.config();

const branchesData = [
  { name: "HDES" },
  { name: "DB" },
  { name: "Thane" },
  { name: "GB" },
  { name: "Airoli" },
  { name: "Bhandup" },
  { name: "Powai" },
  { name: "GHK" },
  { name: "MD" }
];

const batchesData = [
  { branch: "HDES", name: "--" },
  { branch: "DB", name: "JEE" },
  { branch: "Thane", name: "11th CET" },
  { branch: "Thane", name: "11th N.I" },
  { branch: "Thane", name: "11th INT" },
  { branch: "Thane", name: "12th N.I" },
  { branch: "Thane", name: "12th INT" },
  { branch: "GB", name: "11th" },
  { branch: "GB", name: "12th" },
  { branch: "Airoli", name: "11th" },
  { branch: "Airoli", name: "12th" },
  { branch: "Bhandup", name: "11th N.I" },
  { branch: "Bhandup", name: "11th INT" },
  { branch: "Bhandup", name: "12th" },
  { branch: "Powai", name: "11th" },
  { branch: "Powai", name: "12th" },
  { branch: "GHK", name: "11th JEE" },
  { branch: "GHK", name: "11th NEET" },
  { branch: "GHK", name: "11th NI" },
  { branch: "GHK", name: "12th JEE" },
  { branch: "GHK", name: "12th NEET" },
  { branch: "GHK", name: "12th NI" },
  { branch: "MD", name: "--" }
];

const seed = async () => {
  await connectDb();

  await Batch.deleteMany({});
  await Branch.deleteMany({});

  const insertedBranches = await Branch.insertMany(branchesData);
  const branchMap = new Map(insertedBranches.map((branch) => [branch.name, branch._id]));

  const insertedBatches = await Batch.insertMany(
    batchesData.map((batch) => ({
      name: batch.name,
      branch: branchMap.get(batch.branch)
    }))
  );

  console.log(`Seeded ${insertedBranches.length} branches and ${insertedBatches.length} batches.`);
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
