import { Pool } from "mysql2/promise";

export const initializeOrderDB = async (pool: Pool): Promise<void> => {
  console.log("🛠️ Revisando tabla de Órdenes...");

  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                recipe_name VARCHAR(100),
                status VARCHAR(50) NOT NULL DEFAULT 'en preparación',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    console.log("✅ Tabla 'orders' lista en Railway.");
  } catch (error) {
    console.error("❌ Error inicializando la tabla de Órdenes:", error);
    throw error;
  }
};
