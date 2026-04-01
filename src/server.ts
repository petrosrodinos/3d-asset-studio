import "dotenv/config";
import express from "express";
import path from "path";
import chatRouter from "./routes/chat";
import pipelineRouter from "./routes/pipeline";
import imagesRouter from "./routes/images";
import balanceRouter from "./routes/balance";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/chat", chatRouter);
app.use("/api/tripo/pipeline", pipelineRouter);
app.use("/api/aiml", imagesRouter);
app.use("/api/balance", balanceRouter);

app.get("/api/tripo/task/:id", async (req, res) => {
  const { getTripo } = await import("./services");
  try {
    res.json(await getTripo().getTask(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

const PORT = parseInt(process.env.PORT ?? "3000", 10);
app.listen(PORT, () => {
  console.log(`\n  ⬡  3D Figures — The Forge`);
  console.log(`     http://localhost:${PORT}\n`);
});
