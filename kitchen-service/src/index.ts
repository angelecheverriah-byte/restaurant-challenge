import express from "express";
import { createClient } from "redis";
import mysql from "mysql2/promise"; // IMPORTANTE: Faltaba esta importación
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Configuración de Redis
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

// URL de la Bodega
const WAREHOUSE_URL =
  process.env.WAREHOUSE_URL ||
  "http://warehouse-service:3003/inventory/request";

// Configuración de MySQL
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "restaurant_db",
  ssl: {
    rejectUnauthorized: false,
  },
};

// Definición de las 6 recetas obligatorias
const recipes = [
  {
    name: "Ensalada César con Pollo",
    ingredients: { chicken: 1, lettuce: 2, cheese: 1, lemon: 1 },
  },
  {
    name: "Arroz con Carne y Tomate",
    ingredients: { rice: 1, meat: 1, tomato: 2 },
  },
  {
    name: "Papas con Queso y Cebolla",
    ingredients: { potato: 2, cheese: 1, onion: 1 },
  },
  {
    name: "Hamburguesa de la Casa",
    ingredients: { meat: 1, lettuce: 1, tomato: 1, ketchup: 1, onion: 1 },
  },
  {
    name: "Pollo al Limón con Arroz",
    ingredients: { chicken: 1, lemon: 2, rice: 1 },
  },
  { name: "Papas Bravas", ingredients: { potato: 2, ketchup: 2, onion: 1 } },
];

// --- ENDPOINTS PARA EL FRONTEND ---
app.get("/recipes", (req, res) => {
  res.json(recipes);
});

// --- LÓGICA DEL WORKER (REDIS) ---
async function startKitchen() {
  try {
    await redisClient.connect();
    console.log("👨‍🍳 Cocina conectada a Redis correctamente.");

    // Suscribirse al canal de nuevas órdenes
    await redisClient.subscribe("new_order", async (message) => {
      let currentOrderId: number | null = null;
      let connection;

      try {
        const parsedMessage = JSON.parse(message);
        currentOrderId = parsedMessage.orderId;

        const randomRecipe =
          recipes[Math.floor(Math.random() * recipes.length)];
        console.log(
          `🍳 Procesando Orden #${currentOrderId}: ${randomRecipe.name}`,
        );

        // Crear conexión para esta operación (evita errores de timeout o cierre de socket)
        connection = await mysql.createConnection(dbConfig);

        // 1. Actualizar estado a 'preparando'
        await connection.execute(
          "UPDATE orders SET recipe_name = ?, status = 'preparando' WHERE id = ?",
          [randomRecipe.name, currentOrderId],
        );

        // 2. Avisar a la Bodega
        const response = await axios.post(
          `${process.env.WAREHOUSE_URL}/inventory/request`,
          {
            orderId: currentOrderId,
            recipeName: randomRecipe.name,
            ingredients: randomRecipe.ingredients,
          },
        );

        if (response.data.status === "queued") {
          console.log(`📡 Orden #${currentOrderId} en cola de bodega.`);
        }
      } catch (error: any) {
        console.error(
          `❌ Error en Cocina para Orden #${currentOrderId || "Desconocida"}:`,
          error.message,
        );
      } finally {
        if (connection) await connection.end(); // Cerrar conexión para no saturar MySQL
      }
    });
  } catch (error) {
    console.error("❌ Fallo crítico al iniciar la cocina:", error);
  }
}

// Iniciar servidor
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🍳 Kitchen API corriendo en puerto ${PORT}`);
  startKitchen().catch(console.error);
});
