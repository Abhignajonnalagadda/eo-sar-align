const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs-extra");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

const UPLOAD_DIR = "../data/uploads";
const OUTPUT_DIR = "../data/outputs";
const JOBS_FILE = "../data/jobs.json";

// Ensure directories exist
fs.ensureDirSync(UPLOAD_DIR);
fs.ensureDirSync(OUTPUT_DIR);
if (!fs.existsSync(JOBS_FILE)) fs.writeJsonSync(JOBS_FILE, []);

// Multer setup
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const imageId = uuidv4() + path.extname(file.originalname);
    cb(null, imageId);
  },
});
const upload = multer({ storage });

// --------- Endpoints ---------

// 1. Upload endpoint
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({
    imageId: req.file.filename,
    filename: req.file.originalname,
    size: req.file.size,
  });
});

// 2. Create Job
app.post("/api/jobs", async (req, res) => {
  const { imageAId, imageBId, aoi } = req.body;
  if (!imageAId || !imageBId || !aoi)
    return res.status(400).json({ error: "Missing data" });

  const jobId = uuidv4();
  const jobDir = path.join(OUTPUT_DIR, jobId);
  fs.ensureDirSync(jobDir);

  let jobs;
  try {
    jobs = await fs.readJson(JOBS_FILE);
  } catch (error) {
    console.log("Jobs file is empty or invalid, initializing with empty array");
    jobs = [];
  }
  
  const newJob = {
    jobId,
    status: "Pending",
    imageAId,
    imageBId,
    aoi,
    outputs: null,
    error: null,
  };
  jobs.push(newJob);
  await fs.writeJson(JOBS_FILE, jobs);

  // Spawn Python worker
  const aoiStr = `north=${aoi.north};south=${aoi.south};east=${aoi.east};west=${aoi.west}`;
  const worker = spawn("python3", [
    path.join(__dirname, "../worker/worker.py"), // full path to worker.py
    "--image_a",
    path.join(UPLOAD_DIR, imageAId),
    "--image_b",
    path.join(UPLOAD_DIR, imageBId),
    "--aoi",
    aoiStr,
    "--out_dir",
    jobDir,
  ]);

  let workerOutput = "";
  let workerError = "";

  worker.stdout.on("data", (data) => {
    workerOutput += data.toString();
    console.log(`Worker stdout: ${data}`);
  });

  worker.stderr.on("data", (data) => {
    workerError += data.toString();
    console.error(`Worker stderr: ${data}`);
  });

  worker.on("exit", async (code) => {
    console.log(`Worker exited with code ${code}`);
    console.log(`Worker output: ${workerOutput}`);
    if (workerError) {
      console.error(`Worker error: ${workerError}`);
    }

    let jobs;
    try {
      jobs = await fs.readJson(JOBS_FILE);
    } catch (error) {
      console.log("Jobs file is empty or invalid, initializing with empty array");
      jobs = [];
    }
    
    const job = jobs.find((j) => j.jobId === jobId);
    if (job) {
      if (code === 0) {
        job.status = "Done";
        job.outputs = {
          imageAUrl: `/data/outputs/${jobId}/A_clipped.tif`,
          imageBUrl: `/data/outputs/${jobId}/B_clipped_aligned.tif`,
        };
      } else {
        job.status = "Error";
        job.error = `Worker exited with code ${code}. Error: ${workerError}`;
      }
      await fs.writeJson(JOBS_FILE, jobs);
    }
  });

  res.json({ jobId });
});

// 3. Get Job Status
app.get("/api/jobs/:jobId", async (req, res) => {
  const { jobId } = req.params;
  let jobs;
  try {
    jobs = await fs.readJson(JOBS_FILE);
  } catch (error) {
    console.log("Jobs file is empty or invalid, initializing with empty array");
    jobs = [];
  }
  
  const job = jobs.find((j) => j.jobId === jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

// Serve outputs (optional)
app.use("/data/outputs", express.static(OUTPUT_DIR));

app.listen(PORT, () => console.log(`API server running on port ${PORT}`));
