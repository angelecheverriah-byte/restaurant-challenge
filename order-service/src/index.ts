import express from "express";
import cors from "cors";
import { createClient } from "redis";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Cargar variables de entorno del archivo .env
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Configuración dinámica usando variables de entorno
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3307, // Nota: Internamente en Docker es 3306
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "restaurant_db",
  charset: "utf8mb4",
};

// Endpoint para crear una orden
app.post("/orders", async (req, res) => {
  let pool;
  try {
    pool = await mysql.createPool(dbConfig);

    // Insertar orden
    const [result]: any = await pool.execute(
      "INSERT INTO orders (status) VALUES ('en preparación')",
    );

    const orderId = result.insertId;

    // Notificar a la Cocina vía Redis
    // Importante: Usamos el canal 'new_order' que espera la cocina
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
    res.json(rows); // Esto le quita el error 404 al Frontend
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  } finally {
    if (pool) await pool.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  try {
    await redisClient.connect();
    console.log(`🚀 Gerente (Order Service) corriendo en puerto ${PORT}`);
    console.log(`🔗 Conectado a DB en: ${dbConfig.host}:${dbConfig.port}`);
  } catch (err) {
    console.error("❌ No se pudo conectar a Redis:", err);
  }
});
