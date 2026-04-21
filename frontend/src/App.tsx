import { useState, useEffect } from "react";
import axios from "axios";
import {
  ShoppingCart,
  ChefHat,
  Package,
  History,
  PlusCircle,
  Activity,
  Box,
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
  created_at: string;
}

interface InventoryItem {
  name: string;
  quantity: number;
}

interface PurchaseHistory {
  id: number;
  ingredient_name: string;
  quantity_bought: number;
  purchased_at: string;
}

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

      if (Array.isArray(resOrders.data)) setOrders(resOrders.data);
      if (Array.isArray(resInv.data)) setInventory(resInv.data);
      if (Array.isArray(resRecipes.data)) setRecipes(resRecipes.data);
      if (Array.isArray(resHistory.data)) setPurchaseHistory(resHistory.data);
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
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 font-sans text-slate-300">
      {/* HEADER ESTILO GLASSMORPHISM */}
      <header className="max-w-7xl mx-auto mb-10 flex justify-between items-center bg-slate-800/50 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
            <ChefHat size={32} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
              IP <span className="text-emerald-500">KITCHEN</span>
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              SISTEMA OPERATIVO ACTIVO
            </div>
          </div>
        </div>
        <button
          onClick={handleCreateOrder}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 disabled:opacity-50"
        >
          <PlusCircle size={22} />{" "}
          {loading ? "PROCESANDO..." : "SOLICITAR PLATO"}
        </button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-4 space-y-8">
          {/* BODEGA CON ESTILO INDUSTRIAL */}
          <section className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 shadow-xl">
            <h2 className="text-sm font-black mb-6 flex items-center gap-2 text-slate-100 uppercase tracking-[0.2em]">
              <Box size={18} className="text-emerald-500" /> Inventario Real
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {inventory.map((item) => (
                <div
                  key={item.name}
                  className="p-3 bg-slate-900/50 border border-slate-700/30 rounded-2xl flex justify-between items-center transition-hover hover:border-emerald-500/30"
                >
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    {item.name}
                  </span>
                  <span
                    className={`font-mono text-lg font-bold ${item.quantity < 2 ? "text-red-400" : "text-emerald-400"}`}
                  >
                    {item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-700/50 pt-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity size={14} /> Log de Suministros
              </h3>
              <div className="h-56 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {purchaseHistory.length === 0 ? (
                  <p className="text-xs text-slate-600 italic text-center py-4">
                    Esperando transacciones...
                  </p>
                ) : (
                  purchaseHistory.map((buy) => (
                    <div
                      key={buy.id}
                      className="text-[10px] p-3 bg-slate-900/30 rounded-xl border border-slate-700/20 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-slate-200 uppercase">
                          {buy.ingredient_name}
                        </p>
                        <p className="text-slate-500">
                          {new Date(buy.purchased_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md font-bold">
                        +{buy.quantity_bought}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* RECETARIO MÁS DISCRETO */}
          <section className="bg-slate-800/20 p-6 rounded-3xl border border-slate-700/30">
            <h2 className="text-xs font-black mb-4 flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              Manual de Cocina
            </h2>
            <div className="space-y-2">
              {recipes.map((recipe, idx) => (
                <details
                  key={idx}
                  className="group bg-slate-900/20 rounded-xl border border-slate-700/20 overflow-hidden"
                >
                  <summary className="p-3 text-[11px] font-bold text-slate-300 uppercase cursor-pointer hover:bg-slate-700/20 transition-colors list-none flex justify-between items-center">
                    {recipe.name}
                    <span className="text-slate-600 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <div className="p-3 pt-0 text-[10px] text-slate-500 italic border-t border-slate-700/10">
                    {Object.entries(recipe.ingredients)
                      .map(([n, q]) => `${n} (${q})`)
                      .join(" • ")}
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-8">
          <section className="bg-slate-800/40 p-8 rounded-3xl border border-slate-700/50 shadow-xl h-full">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-sm font-black flex items-center gap-2 text-slate-100 uppercase tracking-[0.2em]">
                <History size={18} className="text-emerald-500" /> Monitor de
                Órdenes
              </h2>
              <span className="text-[10px] bg-slate-700/50 px-3 py-1 rounded-full text-slate-400 font-bold">
                TOTAL: {orders.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase tracking-[0.2em] border-b border-slate-700/50">
                    <th className="pb-4 text-left font-black">Ref.</th>
                    <th className="pb-4 text-left font-black">Preparación</th>
                    <th className="pb-4 text-left font-black">Estado Actual</th>
                    <th className="pb-4 text-right font-black">Tiempo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="group hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="py-5 font-mono text-xs text-slate-500 font-bold">
                        #{String(order.id).padStart(3, "0")}
                      </td>
                      <td className="py-5 font-bold text-slate-200">
                        {order.recipe_name || (
                          <span className="text-slate-600 animate-pulse">
                            Asignando receta...
                          </span>
                        )}
                      </td>
                      <td className="py-5">
                        <span
                          className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                            order.status === "finalizada"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                          }`}
                        >
                          {order.status === "finalizada"
                            ? "✓ Despachado"
                            : "○ En Fuego"}
                        </span>
                      </td>
                      <td className="py-5 text-right font-mono text-[11px] text-slate-500">
                        {new Date(order.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
