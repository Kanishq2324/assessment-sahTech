import express from 'express';
import "dotenv/config";
import { runPipeline } from "./src/pipeline.js";


// intitialize express app
const app = express();


// express middlewares
app.use(express.json({
    limit: "16kb"
}));


// PORT 
const PORT = process.env.PORT || 3000;


// Standard Routes + Controllers
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Server running"
  });
});


// One endpoint to run the full assessment flow
app.post("/run", async (req, res) => {
  try {

    // The entire flow from gathering the product data to summaries creation
    // and speech file creation is handle by the function

    const result = await runPipeline();

    res.json({
      success: true,
      message: "Pipeline completed successfully.",
      result
    });

  } catch (err) {
    res.status(500).json({   // (500) status code used to determine if there's an error in API
      success: false,
      message: err.message
    });
  }
});

// DB is not there is no connection prior to listening
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
  console.log(`POST http://localhost:${PORT}/run to execute the full task`);
});