import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { createServer as createViteServer } from "vite";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import cors from "cors";
import { verifyToken, isAdmin } from "./authMiddleware";
import { sendOrderConfirmationToCustomer, sendNewOrderAlertToAdmin, sendOrderStatusUpdate } from "./src/services/whatsappService";
import { uploadSingleImage, uploadMultipleImages } from "./src/uploadMiddleware";

const prisma = new PrismaClient();

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many requests, try again later." }
});

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many orders placed, try again later." }
});

const app = express();
const PORT = Number(process.env.PORT) || 3000;

export { app };
export default app;

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  app.use(compression());
  app.use(morgan('combined'));
  app.use(cors({ origin: [process.env.APP_URL || 'https://kiswa.pk', 'http://localhost:5173', 'http://localhost:3000'] }));
  
  app.use(express.json());
  
  app.use('/api/', generalLimiter);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date() });
  });

  // --- AUTH ROUTES ---
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

      const isMatch = await bcrypt.compare(password, user.password || "");
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      const payload = { userId: user.id, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET || "super-secret-jwt-key-kiswa", { expiresIn: "7d" });

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }
      });
    } catch (error) {
      console.error("CRITICAL Login error:", error);
      res.status(500).json({ success: false, message: "Server error", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });

  app.get("/api/auth/me", verifyToken, async (req, res) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // --- CUSTOMER AUTH ---
  app.post("/api/auth/customer/login", authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.password || "");
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }

      const payload = { userId: user.id, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET || "super-secret-jwt-key-kiswa", { expiresIn: "7d" });

      res.json({
        success: true,
        data: {
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role }
        }
      });
    } catch (error) {
      console.error("Customer login error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  app.post("/api/auth/customer/register", authLimiter, async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "An account with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "CUSTOMER"
        }
      });

      const payload = { userId: user.id, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET || "super-secret-jwt-key-kiswa", { expiresIn: "7d" });

      res.json({
        success: true,
        data: {
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role }
        }
      });
    } catch (error) {
      console.error("Customer register error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  app.put("/api/auth/customer/profile", verifyToken, async (req, res) => {
    try {
      const { name, phone } = req.body; // phone is not in schema but we just update name
      const user = await prisma.user.update({
        where: { id: req.user.userId },
        data: { name }
      });
      res.json({ success: true, data: { name: user.name, email: user.email } });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  app.put("/api/auth/customer/password", verifyToken, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      const isMatch = await bcrypt.compare(currentPassword, user.password || "");
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Incorrect current password" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { password: hashedPassword }
      });
      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // --- WISHLIST API ---
  app.get("/api/wishlist", verifyToken, async (req, res) => {
    try {
      const items = await prisma.wishlistItem.findMany({
        where: { userId: req.user.userId },
        include: {
          product: {
            include: { variants: true }
          }
        }
      });
      res.json({ success: true, data: items.map(i => i.product) });
    } catch (error) {
      console.error("Wishlist fetch error", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  app.post("/api/wishlist", verifyToken, async (req, res) => {
    try {
      const { productId } = req.body;
      const existing = await prisma.wishlistItem.findFirst({
        where: { userId: req.user.userId, productId }
      });
      if (existing) {
         return res.json({ success: true, message: "Already in wishlist" });
      }
      await prisma.wishlistItem.create({
        data: { userId: req.user.userId, productId }
      });
      res.json({ success: true, message: "Added to wishlist" });
    } catch (error) {
      console.error("Wishlist add error", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  app.post("/api/wishlist/sync", verifyToken, async (req, res) => {
    try {
      const { productIds } = req.body;
      if (!Array.isArray(productIds)) return res.status(400).json({ success: false });

      for (const pId of productIds) {
        const existing = await prisma.wishlistItem.findFirst({
           where: { userId: req.user.userId, productId: pId }
        });
        if (!existing) {
          await prisma.wishlistItem.create({ data: { userId: req.user.userId, productId: pId }});
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Wishlist sync error", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  app.delete("/api/wishlist/:productId", verifyToken, async (req, res) => {
    try {
      await prisma.wishlistItem.deleteMany({
        where: { userId: req.user.userId, productId: req.params.productId }
      });
      res.json({ success: true, message: "Removed from wishlist" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // --- MY ORDERS ---
  app.get("/api/orders/my-orders", verifyToken, async (req, res) => {
    try {
      const orders = await prisma.order.findMany({
        where: {
          OR: [
            { userId: req.user.userId },
          ],
        },
        include: {
          items: {
            include: { product: true, variant: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Also match by email for guest orders converted to logged in user
      const user = await prisma.user.findUnique({ where: { id: req.user.userId }});
      let finalOrders = orders;
      if (user && user.email) {
        const guestOrders = await prisma.order.findMany({
          where: { guestEmail: user.email, userId: null },
          include: { items: { include: { product: true, variant: true } } },
          orderBy: { createdAt: 'desc' }
        });
        finalOrders = [...orders, ...guestOrders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      res.json({ success: true, data: finalOrders });
    } catch (error) {
      console.error("My orders fetch error", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  app.get("/api/auth/customer/me", verifyToken, async (req, res) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      res.json({
        success: true,
        data: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Apply Auth Middleware to all Admin routes
  app.use("/api/admin", verifyToken, isAdmin);

  // --- API ROUTES ---

  // -> GET /api/categories - all active categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await prisma.category.findMany({ 
        where: { isActive: true } 
      });
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fallback for visual preview if DB not configured yet
      res.json([
        { id: "1", name: "Everyday Wear", description: "Premium clothing for everyday comfort and style.", slug: "everyday-wear" },
        { id: "2", name: "Luxury Watches", description: "Masterpieces in time, crafted with precision.", slug: "luxury-watches" }
      ]);
    }
  });

  // -> POST /api/admin/categories - create category (admin only)
  app.post("/api/admin/categories", async (req, res) => {
    try {
      // NOTE: Admin auth placeholder (e.g., check req.headers.authorization)
      const category = await prisma.category.create({ data: req.body });
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ error: "Failed to create category" });
    }
  });

  // -> PUT /api/admin/categories/:id - update category
  app.put("/api/admin/categories/:id", async (req, res) => {
    try {
      const category = await prisma.category.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(400).json({ error: "Failed to update category" });
    }
  });

  // -> DELETE /api/admin/categories/:id - delete category
  app.delete("/api/admin/categories/:id", async (req, res) => {
    try {
      await prisma.category.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(400).json({ error: "Failed to delete category" });
    }
  });

  // -> GET /api/products - all active products (with category, variants)
  app.get("/api/products", async (req, res) => {
    try {
      const { category, sort, size, featured, page = "1", limit = "12" } = req.query;
      
      const filter: any = { isActive: true };
      
      if (featured === 'true') filter.isFeatured = true;
      
      if (category) {
        filter.category = { slug: String(category) };
      }
      
      if (size) {
        filter.variants = {
          some: { size: String(size) }
        };
      }
      
      let orderBy: any = { createdAt: "desc" };
      if (sort === "price_asc") orderBy = { basePrice: "asc" };
      if (sort === "price_desc") orderBy = { basePrice: "desc" };

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: filter,
          include: { category: true, variants: true },
          orderBy,
          skip,
          take,
        }),
        prisma.product.count({ where: filter })
      ]);

      res.json({
        products: products.map(p => ({ ...p, images: p.images ? p.images.split(',') : [] })),
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // -> GET /api/products/featured - isFeatured: true products only
  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        include: { category: true, variants: true },
      });
      res.json(products.map(p => ({ ...p, images: p.images ? p.images.split(',') : [] })));
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.json([
        { id: "1", name: "The Obsidian Blazer", basePrice: 24500 },
        { id: "2", name: "Classic Silk Shirt", basePrice: 12500 },
        { id: "3", name: "Heritage Chronograph", basePrice: 45000 },
        { id: "4", name: "Minimalist Cuff", basePrice: 8200 }
      ]);
    }
  });

  // -> GET /api/products/:slug - single product detail
  app.get("/api/products/:slug", async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { slug: req.params.slug },
        include: { category: true, variants: true, reviews: { include: { user: true }, orderBy: { createdAt: 'desc' } } },
      });
      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json({ ...product, images: product.images ? product.images.split(',') : [] });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // -> GET /api/products/:slug/reviews - fetch reviews for product
  app.get("/api/products/:slug/reviews", async (req, res) => {
    try {
      const { page = "1", limit = "5" } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      
      const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
      if (!product) return res.status(404).json({ error: "Product not found" });

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { productId: product.id },
          include: { user: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.review.count({ where: { productId: product.id } })
      ]);

      res.json({
        reviews,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // -> POST /api/products/:productId/reviews - create review
  app.post("/api/products/:productId/reviews", verifyToken, async (req, res) => {
    try {
      const { rating, comment } = req.body;
      const { productId } = req.params;
      const userId = req.user.userId;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: "Valid rating required" });
      }

      // Optional: Check if user already reviewed
      const existing = await prisma.review.findFirst({
        where: { productId, userId }
      });

      if (existing) {
        return res.status(400).json({ success: false, message: "You have already reviewed this product" });
      }

      const review = await prisma.review.create({
        data: {
          rating,
          comment,
          productId,
          userId
        },
        include: { user: true }
      });

      res.status(201).json({ success: true, data: review });
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ success: false, message: "Failed to create review" });
    }
  });


  // -> POST /api/orders - create an order
  app.post("/api/orders", orderLimiter, async (req, res) => {
    try {
      const { guestName, guestEmail, guestPhone, shippingAddress, paymentMethod, items, totalAmount } = req.body;

      if (!guestName || !guestPhone || !shippingAddress.line1 || !shippingAddress.city || !items || items.length === 0) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      // Use a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create order
        const order = await tx.order.create({
          data: {
            guestName,
            guestEmail,
            guestPhone,
            shippingAddress, // JSON field
            paymentMethod,
            totalAmount,
            status: "PENDING",
            items: {
              create: items.map((item: any) => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.price
              }))
            }
          },
          include: { items: { include: { product: true } } }
        });

        // Deduct inventory
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

      console.log(`Order created successfully: ${result.id}`);
      
      // WhatsApp notification
      try {
        let formattedPhone = guestPhone.replace(/[\s-]/g, '');
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+92' + formattedPhone.slice(1);
        } else if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }

        const results = await Promise.allSettled([
          sendOrderConfirmationToCustomer(result, formattedPhone),
          sendNewOrderAlertToAdmin(result)
        ]);
        
        // If message was sent ok (you might want to be more specific, but we'll say if first promise resolved we mark true)
        if (results[0].status === 'fulfilled') {
          await prisma.order.update({
            where: { id: result.id },
            data: { whatsappSent: true }
          });
        }
      } catch (err) {
        console.error("Error sending WhatsApp notification:", err);
      }

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ success: false, message: "Failed to place order" });
    }
  });

  // -> GET /api/orders/track/:orderId - fetch order tracking public API
  app.get("/api/orders/track/:orderId", async (req, res) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.orderId },
        include: {
          items: {
            include: { product: true, variant: true }
          }
        }
      });
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });

      // We parse shippingAddress to only return safe values for tracking
      let safeShippingAddress: any = null;
      try {
        const parsed = JSON.parse(order.shippingAddress);
        safeShippingAddress = {
          city: parsed.city,
          province: parsed.province
        };
      } catch (e) {
        // Fallback or already an object if using specific sqlite driver/setup
        if (typeof order.shippingAddress === 'object') {
           const sa: any = order.shippingAddress;
           safeShippingAddress = { city: sa.city, province: sa.province };
        }
      }

      const safeOrder = {
        id: order.id,
        status: order.status,
        createdAt: order.createdAt,
        processedAt: order.processedAt,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        cancelledAt: order.cancelledAt,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        shippingAddress: safeShippingAddress,
        items: order.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          productName: item.product?.name,
          productImage: item.product?.images ? item.product.images.split(',')[0] : null,
          size: item.variant?.size,
          color: item.variant?.color
        }))
      };

      res.json({ success: true, data: safeOrder });
    } catch (error) {
      console.error("Error tracking order:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // -> GET /api/orders/:id - fetch order for confirmation page
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          items: {
            include: { product: true, variant: true }
          }
        }
      });
      if (!order) return res.status(404).json({ success: false, message: "Order not found" });
      res.json({ success: true, data: order });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // -> POST /api/admin/products - create product (admin only)
  // Removed old duplicate routes here

  // ---> ADMIN ROUTES <---

  app.post("/api/admin/categories", uploadSingleImage, async (req, res) => {
    try {
      const data = { ...req.body };
      if (req.file) data.image = req.file.path;
      if (data.isActive !== undefined) data.isActive = data.isActive === 'true';
      
      const category = await prisma.category.create({ data });
      res.json(category);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/admin/categories/:id", uploadSingleImage, async (req, res) => {
    try {
      const data = { ...req.body };
      if (req.file) data.image = req.file.path;
      if (data.isActive !== undefined) data.isActive = data.isActive === 'true';

      const category = await prisma.category.update({
        where: { id: req.params.id },
        data,
      });
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", async (req, res) => {
    try {
      await prisma.category.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete category" });
    }
  });

  app.post("/api/admin/products", uploadMultipleImages, async (req, res) => {
    try {
      let parsedVariants;
      try { parsedVariants = req.body.variants ? JSON.parse(req.body.variants) : undefined; } catch(e) {}
      
      let existingImages = [];
      try { existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : []; } catch(e) {}

      const files = req.files as Express.Multer.File[];
      const newImages = files ? files.map(f => f.path) : [];
      let finalImages = [...existingImages, ...newImages];
      
      // We might want to cap it at 5 total images or respect user deletion
      // To support deletion of existing images, the UI should send `existingImages` array.
      
      const { variants, images, existingImages: _, ...productData } = req.body;
      
      // parse numbers/booleans from formData strings
      if (productData.basePrice) productData.basePrice = Number(productData.basePrice);
      if (productData.isFeatured) productData.isFeatured = productData.isFeatured === 'true';

      const product = await prisma.product.create({
        data: {
          ...productData,
          images: finalImages.join(','),
          variants: parsedVariants ? { create: parsedVariants } : undefined
        }
      });
      res.json({ ...product, images: product.images ? product.images.split(',') : [] });
    } catch (error) {
       console.error("Error creating product:", error);
       res.status(400).json({ error: "Failed" });
    }
  });

  app.put("/api/admin/products/:id", uploadMultipleImages, async (req, res) => {
    try {
      let parsedVariants;
      try { parsedVariants = req.body.variants ? JSON.parse(req.body.variants) : undefined; } catch(e) {}

      let existingImages = [];
      try { existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : []; } catch(e) {}

      const files = req.files as Express.Multer.File[];
      const newImages = files ? files.map(f => f.path) : [];
      let finalImages = [...existingImages, ...newImages];
      
      const { variants, images, existingImages: _, ...productData } = req.body;
      
      if (productData.basePrice) productData.basePrice = Number(productData.basePrice);
      if (productData.isFeatured !== undefined) productData.isFeatured = productData.isFeatured === 'true';

      await prisma.variant.deleteMany({ where: { productId: req.params.id } });
      const product = await prisma.product.update({
        where: { id: req.params.id },
        data: {
          ...productData,
          images: finalImages.join(','),
          variants: parsedVariants ? { create: parsedVariants } : undefined
        }
      });
      res.json({ ...product, images: product.images ? product.images.split(',') : [] });
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(400).json({ error: "Failed" });
    }
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    try {
      await prisma.product.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete product" });
    }
  });

  // -> GET /api/admin/orders - all orders
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const orders = await prisma.order.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: true, items: true },
      });
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.json([
        { id: "ORD-001", guestName: "Sarah Khan", totalAmount: 12500, status: "PENDING", paymentMethod: "COD", createdAt: new Date().toISOString(), items: [] },
        { id: "ORD-002", guestName: "Ahmed Ali", totalAmount: 45000, status: "PROCESSING", paymentMethod: "Card", createdAt: new Date(Date.now() - 86400000).toISOString(), items: [] }
      ]);
    }
  });

  // -> PUT /api/admin/orders/:id/status - update order status
  app.put("/api/admin/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      let timestampUpdate = {};
      if (status === "PROCESSING") timestampUpdate = { processedAt: new Date() };
      if (status === "SHIPPED") timestampUpdate = { shippedAt: new Date() };
      if (status === "DELIVERED") timestampUpdate = { deliveredAt: new Date() };
      if (status === "CANCELLED") timestampUpdate = { cancelledAt: new Date() };

      const order = await prisma.order.update({
        where: { id: req.params.id },
        data: { 
          status,
          ...timestampUpdate
        },
        include: { items: { include: { product: true } } }
      });

      try {
        if (order.guestPhone && ['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
          let formattedPhone = order.guestPhone.replace(/[\s-]/g, '');
          if (formattedPhone.startsWith('0')) {
             formattedPhone = '+92' + formattedPhone.slice(1);
          } else if (!formattedPhone.startsWith('+')) {
             formattedPhone = '+' + formattedPhone;
          }
          await sendOrderStatusUpdate(order, formattedPhone, status);
        }
      } catch (err) {
        console.error("Error sending WhatsApp status update:", err);
      }

      res.json(order);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(400).json({ error: "Failed to update order status" });
    }
  });

  // -> GET /api/admin/customers - all customers
  app.get("/api/admin/customers", async (req, res) => {
    try {
      const customers = await prisma.user.findMany({
        where: { role: "CUSTOMER" },
        include: { _count: { select: { orders: true } } },
        orderBy: { createdAt: "desc" }
      });
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.json([
         { id: "CUST-1", name: "Zainab F.", email: "zainab@example.com", _count: { orders: 3 }, createdAt: new Date(Date.now() - 500000000).toISOString() }
      ]);
    }
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    // Serve static files from the React app (only if not on Vercel)
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not on Vercel
  if (!process.env.VERCEL) {
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  }
