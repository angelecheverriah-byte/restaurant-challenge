import { Pool } from "mysql2/promise";

export const initializeWarehouseDB = async (pool: Pool): Promise<void> => {
  console.log("🛠️ Revisando tablas de la Bodega...");

  try {
    // 1. Crear tabla de Inventario
    await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory (
                ingredient_name VARCHAR(50) PRIMARY KEY,
                quantity INT DEFAULT 5
            );
        `);

    // 2. Crear tabla de Historial de Compras
    await pool.query(`
            CREATE TABLE IF NOT EXISTS purchase_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ingredient_name VARCHAR(50),
                quantity_bought INT,
                purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

    // 3. Poblar inventario inicial (Seed)
    // Usamos INSERT IGNORE para que si ya existen, no haga nada y no de error
    const ingredients = [
      ["tomato", 5],
      ["lemon", 5],
      ["potato", 5],
      ["rice", 5],
      ["ketchup", 5],
      ["lettuce", 5],
      ["onion", 5],
      ["cheese", 5],
      ["meat", 5],
      ["chicken", 5],
    ];

    await pool.query(
      `
            INSERT IGNORE INTO inventory (ingredient_name, quantity) VALUES ?
        `,
      [ingredients],
    );

    console.log("✅ Tablas de Bodega e inventario inicial listos.");
  } catch (error) {
    console.error(
      "❌ Error inicializando la base de datos de la Bodega:",
      error,
    );
    throw error; // Re-lanzamos el error para que el servidor no arranque si esto falla
  }
};
