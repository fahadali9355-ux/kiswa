import express from 'express';

export default async (req: any, res: any) => {
  try {
    // Relative path within the api folder
    const { default: app } = await import("./app.js");
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Startup Error:", err);
    res.status(500).json({
      error: "Server Startup Error",
      message: err.message,
      stack: err.stack,
      path: process.cwd()
    });
  }
};
