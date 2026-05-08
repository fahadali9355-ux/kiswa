import express, { Request, Response, NextFunction } from "express";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import { verifyToken, isAdmin } from "./authMiddleware.js";
import { sendOrderConfirmationToCustomer, sendNewOrderAlertToAdmin, sendOrderStatusUpdate } from "../src/services/whatsappService.js";
import { uploadSingleImage, uploadMultipleImages } from "../src/uploadMiddleware.js";
import prisma from "./prisma.js";

const app = express();

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50
});

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({ origin: [process.env.APP_URL || 'https://kiswa.pk', 'http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// --- PUBLIC ROUTES ---
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

app.get("/api/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ where: { isActive: true } });
    res.json(categories);
  } catch (error) {
    res.json([]);
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const { category, featured, page = "1", limit = "12" } = req.query;
    const filter: any = { isActive: true };
    if (featured === 'true') filter.isFeatured = true;
    if (category) filter.category = { slug: String(category) };
    
    const p = parseInt(page as string);
    const l = parseInt(limit as string);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: filter,
        include: { category: true, variants: true },
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * l,
        take: l
      }),
      prisma.product.count({ where: filter })
    ]);

    res.json({
      products: products.map(p => ({ ...p, images: p.images ? p.images.split(',') : [] })),
      pagination: {
        total,
        page: p,
        pages: Math.ceil(total / l)
      }
    });
  } catch (error) {
    res.status(500).json({ products: [], pagination: { total: 0, page: 1, pages: 1 } });
  }
});

app.get("/api/products/featured", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: { category: true, variants: true },
      take: 8,
      orderBy: { createdAt: 'desc' }
    });
    res.json(products.map(p => ({ ...p, images: p.images ? p.images.split(',') : [] })));
  } catch (e) {
    res.json([]);
  }
});

app.get("/api/products/:slug", async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: { category: true, variants: true, reviews: { include: { user: true }, orderBy: { createdAt: 'desc' } } }
    });
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json({ ...product, images: product.images ? product.images.split(',') : [] });
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
});

// --- AUTH ROUTES ---
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== "ADMIN") return res.status(403).json({ success: false, message: "Access denied" });

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || "super-secret-jwt-key-kiswa", { expiresIn: "7d" });
    res.json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/auth/customer/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || "super-secret-jwt-key-kiswa", { expiresIn: "7d" });
    res.json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/auth/customer/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, password: hashedPassword, role: "CUSTOMER" } });
    const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || "super-secret-jwt-key-kiswa", { expiresIn: "7d" });
    res.json({ success: true, data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/auth/customer/me", verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --- ORDERS ---
app.post("/api/orders", async (req, res) => {
  try {
    // Auto-link to user if guestEmail matches an existing account
    let effectiveUserId = userId;
    if (!effectiveUserId && guestEmail) {
      const existingUser = await prisma.user.findUnique({ where: { email: guestEmail } });
      if (existingUser) effectiveUserId = existingUser.id;
    }
    
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          guestName, 
          guestEmail, 
          guestPhone, 
          shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
          paymentMethod, 
          totalAmount, 
          userId: effectiveUserId,
          items: { 
            create: items.map((item: any) => ({
                productId: item.productId, 
                variantId: item.variantId || null, 
                quantity: item.quantity, 
                price: item.price 
            })) 
          }
        },
        include: { items: { include: { product: true } } }
      });

      for (const item of items) {
        if (item.variantId) {
          await tx.variant.update({ 
            where: { id: item.variantId }, 
            data: { stockQty: { decrement: item.quantity } } 
          });
        }
      }
      return order;
    });

    try {
      let formattedPhone = (guestPhone || "").replace(/[\s-]/g, '');
      if (formattedPhone.startsWith('0')) formattedPhone = '+92' + formattedPhone.slice(1);
      else if (formattedPhone && !formattedPhone.startsWith('+')) formattedPhone = '+' + formattedPhone;
      
      if (formattedPhone) {
        await sendOrderConfirmationToCustomer(result, formattedPhone);
        await sendNewOrderAlertToAdmin(result);
        await prisma.order.update({ where: { id: result.id }, data: { whatsappSent: true } });
      }
    } catch (e) {
      console.warn("WhatsApp Notification Failed:", e);
    }

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error("CRITICAL ORDER ERROR:", error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : "Internal Server Error during order placement" 
    });
  }
});

// --- PROTECTED CUSTOMER ROUTES ---
app.get("/api/orders/my-orders", verifyToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { OR: [{ userId: req.user.userId }, { guestEmail: req.user.email }] },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

app.get("/api/wishlist", verifyToken, async (req, res) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.userId },
      include: { product: true }
    });
    res.json({ success: true, data: items.map(i => i.product) });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

app.post("/api/wishlist/sync", verifyToken, async (req, res) => {
  try {
    const { productIds } = req.body;
    for (const pid of productIds) {
      await prisma.wishlistItem.upsert({
        where: { userId_productId: { userId: req.user.userId, productId: pid } },
        update: {},
        create: { userId: req.user.userId, productId: pid }
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.delete("/api/wishlist/:id", verifyToken, async (req, res) => {
  try {
    await prisma.wishlistItem.delete({
      where: { userId_productId: { userId: req.user.userId, productId: req.params.id } }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.put("/api/auth/customer/profile", verifyToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, phone }
    });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// --- ADMIN ROUTES ---
app.use("/api/admin", verifyToken, isAdmin);

app.get("/api/admin/stats", async (req, res) => {
  try {
    const totalOrders = await prisma.order.count();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    const totalRevenue = await prisma.order.aggregate({
      where: {
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    const pendingOrders = await prisma.order.count({
      where: {
        status: 'PENDING'
      }
    });

    res.json({
      totalOrders,
      todayOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      pendingOrders
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});


app.get("/api/admin/orders", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({ 
      include: { 
        user: true, 
        items: { 
          include: { 
            product: true, 
            variant: true 
          } 
        } 
      }, 
      orderBy: { createdAt: "desc" } 
    });
    res.json(orders);
  } catch (error) {
    res.json([]);
  }
});

app.get("/api/admin/customers", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" }
    });

    const customersWithOrders = await Promise.all(users.map(async (user) => {
      const orderCount = await prisma.order.count({
        where: {
          OR: [
            { userId: user.id },
            { guestEmail: user.email }
          ]
        }
      });
      return { ...user, _count: { orders: orderCount } };
    }));

    res.json(customersWithOrders);
  } catch (error) {
    res.json([]);
  }
});

app.get("/api/admin/categories", async (req, res) => {
  const cats = await prisma.category.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(cats);
});

app.post("/api/admin/categories", uploadSingleImage, async (req, res) => {
  try {
    const { name, slug, description, isActive } = req.body;
    const cat = await prisma.category.create({
      data: { name, slug, description, isActive: isActive === 'true', image: req.file?.path }
    });
    res.json(cat);
  } catch (e) {
    res.status(400).json({ error: "Failed" });
  }
});

app.put("/api/admin/categories/:id", uploadSingleImage, async (req, res) => {
  try {
    const { name, slug, description, isActive } = req.body;
    const cat = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, slug, description, isActive: isActive === 'true', image: req.file?.path || undefined }
    });
    res.json(cat);
  } catch (e) {
    res.status(400).json({ error: "Failed" });
  }
});

app.delete("/api/admin/categories/:id", async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

app.post("/api/admin/products", uploadMultipleImages, async (req, res) => {
  try {
    const { name, slug, description, basePrice, categoryId, isFeatured, isActive, variants } = req.body;
    const files = req.files as Express.Multer.File[];
    const images = files ? files.map(f => f.path).join(',') : "";
    
    const product = await prisma.product.create({
      data: { 
        name, 
        slug, 
        description, 
        basePrice: Number(basePrice), 
        categoryId,
        isFeatured: isFeatured === 'true',
        isActive: isActive === 'true',
        images, 
        variants: variants ? { create: JSON.parse(variants).map((v: any) => ({ ...v, stockQty: Number(v.stockQty), priceAdjustment: Number(v.priceAdjustment) })) } : undefined 
      },
      include: { variants: true }
    });
    res.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(400).json({ error: "Failed", details: error instanceof Error ? error.message : String(error) });
  }
});

app.put("/api/admin/products/:id", uploadMultipleImages, async (req, res) => {
  try {
    const { name, slug, description, basePrice, categoryId, isFeatured, isActive, variants, existingImages } = req.body;
    const files = req.files as Express.Multer.File[];
    const newImages = files ? files.map(f => f.path) : [];
    const keepImages = existingImages ? JSON.parse(existingImages) : [];
    const finalImages = [...keepImages, ...newImages].join(',');

    await prisma.variant.deleteMany({ where: { productId: req.params.id } });
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name,
        slug,
        description,
        basePrice: Number(basePrice),
        categoryId,
        isFeatured: isFeatured === 'true',
        isActive: isActive === 'true',
        images: finalImages,
        variants: variants ? { create: JSON.parse(variants).map((v: any) => ({ ...v, stockQty: Number(v.stockQty), priceAdjustment: Number(v.priceAdjustment) })) } : undefined
      }
    });
    res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(400).json({ error: "Failed" });
  }
});

app.delete("/api/admin/products/:id", async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

app.put("/api/admin/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({ 
      where: { id: req.params.id }, 
      data: { status }, 
      include: { items: { include: { product: true } } } 
    });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: "Failed" });
  }
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("APP ERROR:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

export default app;
