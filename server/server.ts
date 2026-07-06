import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Standard middlewares
  app.use(express.json());

  // Mock-up menu seed data
  const seedMenuItems = [
    {
      id: "burger-01",
      name: "Truffle Umami Burger",
      description: "Aged beef patty, caramelized onions, black truffle aioli, melted gruyère on a brioche bun.",
      price: 12.99,
      category: "burgers",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400",
      available: true,
      tags: ["Chef Special", "Premium"]
    },
    {
      id: "bowl-02",
      name: "Harvest Quinoa Bowl",
      description: "Roasted sweet potatoes, avocado, massaged kale, heirloom tomatoes, and citrus-tahini dressing.",
      price: 10.50,
      category: "bowls",
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400",
      available: true,
      tags: ["Vegan", "Gluten-Free"]
    },
    {
      id: "drink-03",
      name: "Cold Brew Matcha Latte",
      description: "Ceremonial grade Japanese Uji matcha, cold-whipped oat milk, and organic agave nectar.",
      price: 5.75,
      category: "drinks",
      imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400",
      available: true,
      tags: ["Cold Press", "Organic"]
    },
    {
      id: "taco-04",
      name: "Chipotle Cauliflower Tacos",
      description: "Crispy cauliflower florets, chipotle slaw, fresh cilantro, hand-pressed blue corn tortillas.",
      price: 9.99,
      category: "tacos",
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=400",
      available: true,
      tags: ["Spicy", "Vegetarian"]
    }
  ];

  // API Endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get Menu Items (can be synchronized with Firestore later)
  app.get("/api/menu", (req, res) => {
    res.json(seedMenuItems);
  });

  // Secure local Server-Side config storage for Gateways
  const fs = await import("fs");
  const configPath = path.join(process.cwd(), "server", "gateway-config.json");

  const getGatewayConfig = () => {
    const defaults = {
      gatewayMode: "sandbox",
      stripeKey: "pk_test_51Nx8O9HnG8R34Fp2vY901Xy89",
      stripeSecret: "sk_test_51Nx8O9HnG8R34Fp2vY901Secret2026",
      paypalClient: "client_sandbox_88x991aa_pp",
      surcharge: "1.5"
    };

    // Support server-side environment variables as a higher-priority source of truth
    if (process.env.STRIPE_PUBLIC_KEY) defaults.stripeKey = process.env.STRIPE_PUBLIC_KEY;
    if (process.env.STRIPE_SECRET_KEY) defaults.stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (process.env.PAYPAL_CLIENT_ID) defaults.paypalClient = process.env.PAYPAL_CLIENT_ID;

    try {
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, "utf-8");
        const parsed = JSON.parse(raw);
        return { ...defaults, ...parsed };
      }
    } catch (err) {
      console.warn("Could not read gateway config file, using defaults:", err);
    }
    return defaults;
  };

  const saveGatewayConfig = (config: any) => {
    try {
      // Ensure the server directory exists
      const dir = path.dirname(configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
      return true;
    } catch (err) {
      console.error("Failed to save gateway config:", err);
      return false;
    }
  };

  const maskSecret = (val: string) => {
    if (!val) return "";
    if (val.length <= 8) return "••••••••";
    return val.substring(0, 8) + "••••••••" + val.substring(val.length - 4);
  };

  // Secure GET: Frontend receives public keys and MASKED secrets only.
  app.get("/api/gateway/config", (req, res) => {
    const config = getGatewayConfig();
    res.json({
      gatewayMode: config.gatewayMode,
      stripeKey: config.stripeKey,
      stripeSecretMasked: maskSecret(config.stripeSecret),
      paypalClientMasked: maskSecret(config.paypalClient),
      surcharge: config.surcharge
    });
  });

  // Secure POST: Saves updated configs, ignoring masked strings so they are never overwritten with '••••'
  app.post("/api/gateway/config", (req, res) => {
    const { gatewayMode, stripeKey, stripeSecret, paypalClient, surcharge } = req.body;
    const currentConfig = getGatewayConfig();

    const updatedConfig = {
      gatewayMode: gatewayMode || currentConfig.gatewayMode,
      stripeKey: stripeKey || currentConfig.stripeKey,
      stripeSecret: stripeSecret && !stripeSecret.includes("••••") ? stripeSecret : currentConfig.stripeSecret,
      paypalClient: paypalClient && !paypalClient.includes("••••") ? paypalClient : currentConfig.paypalClient,
      surcharge: surcharge || currentConfig.surcharge
    };

    const success = saveGatewayConfig(updatedConfig);
    if (success) {
      res.json({ success: true, message: "Gateway configuration saved securely on server" });
    } else {
      res.status(500).json({ error: "Failed to write gateway config on server" });
    }
  });

  // Mock payment verification / checkout (can be client-side Firestore based but backend verifies)
  app.post("/api/checkout/verify", (req, res) => {
    const { orderDetails, paymentMethod } = req.body;
    if (!orderDetails) {
      return res.status(400).json({ error: "Missing order details" });
    }
    // Simulate payment transaction check
    res.json({
      success: true,
      transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      message: "Payment authorized successfully"
    });
  });

  // Vite middleware configuration for development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
