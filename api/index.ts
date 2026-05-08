import express from 'express';

export default async (req: any, res: any) => {
  try {
    const { default: app } = await import("../src/app");
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
