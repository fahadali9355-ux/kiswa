import express from 'express';

const app = express();

app.get('/api/health', (req, res) => {
  res.json({ status: "ok", msg: "Minimal health check works!" });
});

export default app;
