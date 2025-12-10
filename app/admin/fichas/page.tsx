"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  Download,
  Plus,
  ArrowLeft,
  Filter,
  UserCircle2,
  Grid,
  List,
} from "lucide-react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

interface Ficha {
  id: string;
  nome: string;
  email?: string | null;
  profissao?: string | null;
  telefone?: string | null;
  celular?: string | null;
  foto_perfil_url?: string | null;
  created_at: string;
  updated_at: string;
  tipo?: "cliente" | "interno" | "fornecedor_medição" | "fornecedor_software";
}

export default function VisualizacaoFichas() {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewSection, setViewSection] = useState<"clientes" | "interno" | "fornecedores">(
    "clientes"
  );
  const [subSection, setSubSection] = useState<"medição" | "software">("medição");
  const [viewType, setViewType] = useState<"grid" | "table">("grid");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchFichas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append("search", search);
      const res = await fetch(`/api/fichas?${params}`);
      if (!res.ok) throw new Error("Failed to fetch fichas");
      const data = (await res.json()) as {
        fichas: Ficha[];
        pagination: { total: number; totalPages: number };
      };
      setFichas(data.fichas);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFichas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search]);

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja deletar a ficha de ${nome}?`)) return;
    try {
      const res = await fetch(`/api/fichas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchFichas();
    } catch (e) {
      console.error(e);
      alert("Erro ao deletar ficha");
    }
  };

  const handleDownload = (ficha: Ficha) => {
    alert(`Download da ficha ${ficha.nome} em desenvolvimento!`);
  };

  const filtered = fichas.filter((f) => f.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 backdrop-blur-sm p-4 sm:p-6">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700 shadow-sm mb-6 flex items-center justify-between p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fichas Cadastradas</h1>
          </div>
          <Link href="/admin/fichas/novo" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:shadow-lg transition">
            <Plus className="w-5 h-5" />
            Nova Ficha
          </Link>
        </header>

        {/* Section Tabs */}
        <div className="flex space-x-2 mb-4">
          <button onClick={() => setViewSection("clientes")} className={`px-4 py-2 rounded ${viewSection === "clientes" ? "bg-indigo-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}>Clientes</button>
          <button onClick={() => setViewSection("interno")} className={`px-4 py-2 rounded ${viewSection === "interno" ? "bg-indigo-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}>Interno</button>
          <button onClick={() => setViewSection("fornecedores")} className={`px-4 py-2 rounded ${viewSection === "fornecedores" ? "bg-indigo-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}>Fornecedores</button>
        </div>

        {/* Sub‑tabs for fornecedores */}
        {viewSection === "fornecedores" && (
          <div className="flex space-x-2 mb-4 ml-2">
            <button onClick={() => setSubSection("medição")} className={`px-3 py-1 rounded ${subSection === "medição" ? "bg-indigo-500 text-white" : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"}`}>Medição</button>
            <button onClick={() => setSubSection("software")} className={`px-3 py-1 rounded ${subSection === "software" ? "bg-indigo-500 text-white" : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"}`}>Software</button>
          </div>
        )}

        {/* Search & view type controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
            </div>
            <button onClick={() => setViewType("grid")} className={`p-2 rounded ${viewType === "grid" ? "bg-indigo-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}><Grid className="w-5 h-5" /></button>
            <button onClick={() => setViewType("table")} className={`p-2 rounded ${viewType === "table" ? "bg-indigo-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"}`}><List className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <UserCircle2 className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4 animate-bounce" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nenhuma ficha encontrada</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Ajuste os filtros ou crie uma nova ficha.</p>
            <Link href="/admin/fichas/novo" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:shadow-xl transition"><Plus className="w-5 h-5" />Nova Ficha</Link>
          </div>
        ) : viewType === "grid" ? (
          <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {filtered.map((ficha) => (
                <motion.div key={ficha.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                  <div className="h-24 bg-gradient-to-r from-indigo-600 to-indigo-700" />
                  <div className="-mt-12 flex justify-center">
                    {ficha.foto_perfil_url ? (
                      <img src={ficha.foto_perfil_url} alt={ficha.nome} className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-gray-800">{ficha.nome.charAt(0)}</div>
                    )}
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{ficha.nome}</h3>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-2">{ficha.profissao || "Sem profissão"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Criado em {new Date(ficha.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex justify-around border-t border-gray-200 dark:border-gray-700 p-2">
                    <button onClick={() => alert(`Visualizar ${ficha.nome}`)} className="p-2 text-blue-600 hover:text-blue-800" title="Ver detalhes"><Eye className="w-4 h-4" /></button>
                    <Link href={`/admin/fichas/${ficha.id}/editar`} className="p-2 text-gray-600 hover:text-gray-800" title="Editar"><Edit2 className="w-4 h-4" /></Link>
                    <button onClick={() => handleDelete(ficha.id, ficha.nome)} className="p-2 text-red-600 hover:text-red-800" title="Deletar"><Trash2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDownload(ficha)} className="p-2 text-green-600 hover:text-green-800" title="Download PDF"><Download className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="p-2 text-left">Nome</th><th className="p-2 text-left">Profissão</th><th className="p-2 text-left">Criado em</th><th className="p-2 text-left">Ações</th></tr></thead>
              <tbody>
                {filtered.map((ficha) => (
                  <tr key={ficha.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td className="p-2 flex items-center gap-2">
                      {ficha.foto_perfil_url ? (<img src={ficha.foto_perfil_url} alt={ficha.nome} className="w-8 h-8 rounded-full object-cover" />) : (<div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">{ficha.nome.charAt(0)}</div>)}
                      {ficha.nome}
                    </td>
                    <td className="p-2">{ficha.profissao || "-"}</td>
                    <td className="p-2">{new Date(ficha.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="p-2 flex gap-2 justify-center">
                      <button onClick={() => alert(`Visualizar ${ficha.nome}`)} className="p-1 text-blue-600 hover:text-blue-800" title="Ver detalhes"><Eye className="w-4 h-4" /></button>
                      <Link href={`/admin/fichas/${ficha.id}/editar`} className="p-1 text-gray-600 hover:text-gray-800" title="Editar"><Edit2 className="w-4 h-4" /></Link>
                      <button onClick={() => handleDelete(ficha.id, ficha.nome)} className="p-1 text-red-600 hover:text-red-800" title="Deletar"><Trash2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDownload(ficha)} className="p-1 text-green-600 hover:text-green-800" title="Download PDF"><Download className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={pagination.page === 1} className="px-4 py-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white disabled:opacity-50">Anterior</button>
            <span className="px-4 py-2 text-gray-700 dark:text-gray-300">Página {pagination.page} de {pagination.totalPages}</span>
            <button onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))} disabled={pagination.page === pagination.totalPages} className="px-4 py-2 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white disabled:opacity-50">Próxima</button>
          </div>
        )}
      </div>
    </>
  );
}
