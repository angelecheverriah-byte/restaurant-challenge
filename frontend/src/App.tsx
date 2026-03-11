import { useState, useEffect } from "react";
import axios from "axios";
import {
  ShoppingCart,
  ChefHat,
  Package,
  History,
  PlusCircle,
} from "lucide-react";

// --- INTERFACES ---
interface Ingredient {
  [key: string]: number;
}

interface Recipe {
  name: string;
  ingredients: Ingredient;
}

interface Order {
  id: number;
  recipe_name: string;
  status: "pendiente" | "finalizada";
  purchased_at: string;
  created_at: string; // Sincronizado con el nombre de tu tabla
}

interface InventoryItem {
  name: string;
  quantity: number;
}

interface PurchaseHistory {
  id: number;
  ingredient_name: string;
  quantity_bought: number; // Sincronizado con tu DESCRIBE
  purchased_at: string; // Sincronizado con tu DESCRIBE
}

// En el archivo del Frontend
const API_ORDER = import.meta.env.VITE_API_ORDER || "http://localhost:3001";
const API_KITCHEN = import.meta.env.VITE_API_KITCHEN || "http://localhost:3002";
const API_WAREHOUSE =
  import.meta.env.VITE_API_WAREHOUSE || "http://localhost:3003";

function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshData = async () => {
    try {
      const [resOrders, resInv, resRecipes, resHistory] = await Promise.all([
        axios.get(`${API_ORDER}/orders`),
        axios.get(`${API_WAREHOUSE}/inventory`),
        axios.get(`${API_KITCHEN}/recipes`),
        axios.get(`${API_WAREHOUSE}/inventory/history`),
      ]);
      setOrders(resOrders.data);
      setInventory(resInv.data);
      setRecipes(resRecipes.data);
      setPurchaseHistory(resHistory.data);
    } catch (err) {
      console.error("Error actualizando datos", err);
    }
  };

  const handleCreateOrder = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_ORDER}/orders`);
      await refreshData();
    } catch (err) {
      alert("Error al enviar orden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      {/* HEADER */}
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-indigo-600 flex items-center gap-2">
            <ChefHat size={32} /> ALEGRA RESTAURANT
          </h1>
          <p className="text-slate-500 text-sm">
            Panel de Control de Microservicios
          </p>
        </div>
        <button
          onClick={handleCreateOrder}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <PlusCircle size={20} /> {loading ? "Procesando..." : "PEDIR PLATO"}
        </button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: RECETAS Y ESTADO BODEGA */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700">
              <ChefHat size={20} className="text-indigo-500" /> Recetario
            </h2>
            <div className="space-y-3">
              {recipes.map((recipe, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs"
                >
                  <p className="font-bold text-indigo-700 uppercase mb-1">
                    {recipe.name}
                  </p>
                  <p className="text-slate-600 italic">
                    {Object.entries(recipe.ingredients)
                      .map(([name, qty]) => `${name} x${qty}`)
                      .join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700">
              <Package size={20} className="text-indigo-500" /> Bodega
            </h2>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {inventory.map((item) => (
                <div
                  key={item.name}
                  className="p-2 border rounded-lg flex justify-between items-center bg-white shadow-sm"
                >
                  <span className="text-[10px] font-medium text-slate-500 uppercase">
                    {item.name}
                  </span>
                  <span
                    className={`font-bold ${item.quantity < 2 ? "text-red-500" : "text-slate-800"}`}
                  >
                    {item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                <ShoppingCart size={14} /> Historial de Compras
              </h3>
              <div className="h-48 overflow-y-auto pr-2 space-y-2">
                {purchaseHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Sin compras aún.
                  </p>
                ) : (
                  purchaseHistory.map((buy) => (
                    <div
                      key={buy.id}
                      className="text-[10px] flex flex-col p-2 bg-indigo-50 rounded border border-indigo-100"
                    >
                      <div className="flex justify-between">
                        <span className="font-bold text-indigo-700 uppercase">
                          {buy.ingredient_name}
                        </span>
                        <span className="font-medium text-indigo-600">
                          +{buy.quantity_bought}
                        </span>
                      </div>
                      <span className="text-[8px] text-slate-400">
                        {new Date(buy.purchased_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL DE PEDIDOS */}
        <div className="lg:col-span-8">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700">
              <History size={20} className="text-indigo-500" /> Historial de
              Órdenes
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase tracking-widest border-b border-slate-50">
                    <th className="pb-4 font-black">ID</th>
                    <th className="pb-4 font-black">Plato</th>
                    <th className="pb-4 font-black">Estado</th>
                    <th className="pb-4 font-black">Hora</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 font-bold text-slate-400">
                        #{order.id}
                      </td>
                      <td className="py-4 font-semibold text-slate-700">
                        {order.recipe_name || "En proceso..."}
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            order.status === "finalizada"
                              ? "bg-green-100 text-green-600"
                              : "bg-amber-100 text-amber-600 animate-pulse"
                          }`}
                        >
                          {order.status === "finalizada"
                            ? "Entregado"
                            : "Cocinando"}
                        </span>
                      </td>
                      <td className="py-4 text-slate-400 text-xs">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
