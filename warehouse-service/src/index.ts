import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { initializeWarehouseDB } from "./config/initDb";

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// --- CONFIGURACIÓN DE BASE DE DATOS ---
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "railway",
  charset: "utf8mb4",
};

const MARKET_API_URL = process.env.MARKET_API_URL || "";

// --- CONFIGURACIÓN DE REDIS ---

const redisConnection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  },
);

const inventoryQueue = new Queue("inventory-requests", {
  connection: redisConnection as any,
});

// --- EL WORKER: PROCESADOR DE LA COLA ---
const worker = new Worker(
  "inventory-requests",
  async (job: Job) => {
    const { orderId, recipeName, ingredients } = job.data;
    console.log(`\n📦 [COLA] Procesando Orden #${orderId} (${recipeName})...`);

    let connection;

    try {
      connection = await mysql.createConnection(dbConfig);

      for (const [name, qtyRequired] of Object.entries(ingredients)) {
        let [rows]: any = await connection.execute(
          "SELECT quantity FROM inventory WHERE ingredient_name = ?",
          [name],
        );

        let currentStock = rows[0]?.quantity || 0;

        while (currentStock < (qtyRequired as number)) {
          console.log(
            `🛒 [Orden #${orderId}] Comprando ${name} en la plaza...`,
          );
          const { data } = await axios.get(MARKET_API_URL, {
            params: { ingredient: name.toLowerCase() },
          });
          const bought = data.quantitySold || 0;

          if (bought > 0) {
            await connection.execute(
              "UPDATE inventory SET quantity = quantity + ? WHERE ingredient_name = ?",
              [bought, name],
            );
            await connection.execute(
              "INSERT INTO purchase_history (ingredient_name, quantity_bought) VALUES (?, ?)",
              [name, bought],
            );
            currentStock += bought;
            console.log(
              `💰 [Orden #${orderId}] +${bought} unidades de ${name}`,
            );
          } else {
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
      }

      console.log(`📉 [Orden #${orderId}] Descontando ingredientes...`);
      for (const [name, qty] of Object.entries(ingredients)) {
        await connection.execute(
          "UPDATE inventory SET quantity = GREATEST(0, quantity - ?) WHERE ingredient_name = ?",
          [Number(qty), name],
        );
      }

      await connection.execute(
        'UPDATE orders SET recipe_name = ?, status = "finalizada" WHERE id = ?',
        [recipeName, orderId],
      );

      console.log(`✅ [COLA] Orden #${orderId} finalizada exitosamente.`);
    } catch (error: any) {
      console.error(`❌ [COLA] Error en Job #${orderId}:`, error.message);
      throw error;
    } finally {
      if (connection) await connection.end();
    }
  },
  {
    connection: redisConnection as any,
    concurrency: 1,
  },
);

// --- ENDPOINTS ---
app.post("/inventory/request", async (req, res) => {
  const { orderId, recipeName, ingredients } = req.body;
  try {
    await inventoryQueue.add(`order-${orderId}`, {
      orderId,
      recipeName,
      ingredients,
    });
    res.json({ status: "queued", message: "Orden en espera de ingredientes" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/inventory", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT ingredient_name as name, quantity FROM inventory",
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

app.get("/inventory/history", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT id, ingredient_name, quantity_bought, purchased_at FROM purchase_history ORDER BY purchased_at DESC",
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

// --- ARRANQUE SEGURO ---
const PORT = process.env.PORT || 3003;

async function startServer() {
  try {
    // 1. Crear conexión temporal para inicializar la DB
    const pool = mysql.createPool(dbConfig);

    // 2. Ejecutar script de inicialización
    await initializeWarehouseDB(pool);
    await pool.end(); // Cerramos el pool de inicialización

    // 3. Iniciar Express
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`📦 Bodega conectada y lista en puerto ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Fallo crítico al iniciar Bodega:", error);
    process.exit(1);
  }
}

startServer();
