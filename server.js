const express = require("express");
const path = require("path");
const RunwayML = require("@runwayml/sdk").default;
require("dotenv").config();

const app = express();
const PORT = 8000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const runway = new RunwayML({
  apiKey: process.env.RUNWAYML_API_SECRET
});


// ================================
// BACKEND STATUS
// ================================

app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "Easy Video AI backend is running"
  });
});


// ================================
// VIDEO GENERATION
// ================================

app.post("/api/generate", async (req, res) => {

  try {

    const { prompt, duration, ratio } = req.body;


    // Check prompt
    if (
      typeof prompt !== "string" ||
      !prompt.trim()
    ) {

      return res.status(400).json({
        success: false,
        error: "Please enter a video prompt."
      });

    }


    // Check duration
    const videoDuration = Number(duration);

    if (
      !Number.isInteger(videoDuration) ||
      videoDuration < 2 ||
      videoDuration > 10
    ) {

      return res.status(400).json({
        success: false,
        error: "Duration must be between 2 and 10 seconds."
      });

    }


    // Check aspect ratio
    const allowedRatios = [
      "1280:720",
      "720:1280"
    ];

    if (!allowedRatios.includes(ratio)) {

      return res.status(400).json({
        success: false,
        error: "Unsupported aspect ratio."
      });

    }


    console.log("Starting Runway generation...");
    console.log("Duration:", videoDuration);
    console.log("Ratio:", ratio);


    // Create Runway video task
    const task = await runway.imageToVideo
      .create({
        model: "gen4.5",
        promptText: prompt.trim(),
        ratio: ratio,
        duration: videoDuration
      })
      .waitForTaskOutput();


    // Check returned video
    if (
      !task ||
      !task.output ||
      !task.output[0]
    ) {

      throw new Error(
        "Runway completed the task but did not return a video URL."
      );

    }


    console.log("Runway generation completed.");


    // Send video URL to website
    res.json({
      success: true,
      videoUrl: task.output[0]
    });


  } catch (error) {

    console.error("Runway generation error:");
    console.error(error);


    res.status(500).json({
      success: false,
      error:
        error.message ||
        "Video generation failed."
    });

  }

});


// ================================
// START SERVER
// ================================

app.listen(PORT, () => {

  console.log(
    `Easy Video AI is running on port ${PORT}`
  );

});