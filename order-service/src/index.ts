import express from "express";
import cors from "cors";
import { createClient } from "redis";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { initializeOrderDB } from "./config/initDb";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "railway",
  charset: "utf8mb4",
  ssl: {
    rejectUnauthorized: false,
  },
};

// Endpoint para crear una orden
app.post("/orders", async (req, res) => {
  let pool;
  try {
    pool = await mysql.createPool(dbConfig);

    // Insertar orden (ahora la tabla ya existe gracias al script de arranque)
    const [result]: any = await pool.execute(
      "INSERT INTO orders (status) VALUES ('en preparación')",
    );

    const orderId = result.insertId;

    // Notificar a la Cocina vía Redis
    await redisClient.publish("new_order", JSON.stringify({ orderId }));

    console.log(`✅ Orden #${orderId} encolada exitosamente`);

    res.status(202).json({
      message: "Orden enviada a cocina",
      orderId,
    });
  } catch (error) {
    console.error("❌ Error en Order Service:", error);
    res.status(500).json({ error: "Error al procesar la orden" });
  } finally {
    if (pool) await pool.end();
  }
});

app.get("/orders", async (req, res) => {
  let pool;
  try {
    pool = await mysql.createPool(dbConfig);
    const [rows] = await pool.execute(
      "SELECT * FROM orders ORDER BY created_at DESC",
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    if (pool) await pool.end();
  }
});

// --- ARRANQUE SEGURO ---
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // 1. Inicializar la Base de Datos antes de aceptar peticiones
    const pool = mysql.createPool(dbConfig);
    await initializeOrderDB(pool);
    await pool.end();

    // 2. Conectar Redis
    await redisClient.connect();
    console.log("🔗 Redis conectado.");

    // 3. Iniciar Express
    app.listen(PORT, () => {
      console.log(`🚀 Gerente (Order Service) corriendo en puerto ${PORT}`);
      console.log(`🔗 DB Host: ${dbConfig.host}`);
    });
  } catch (error) {
    console.error("❌ Fallo crítico al iniciar Order Service:", error);
    process.exit(1);
  }
}

startServer();
