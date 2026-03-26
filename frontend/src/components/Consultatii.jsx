// frontend/src/pages/Consultatii.jsx
import { useState, useEffect, useCallback } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

const FORMAT_DATA = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ro-RO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function Consultatii() {
  const [consultatii, setConsultatii] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null); // consultatie deschisa in modal
  const navigate = useNavigate();
  const PER_PAGE = 20;

  const fetchConsultatii = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagina };
      if (search) params.search = search;
      const res = await api.get("/consultatii/", { params });
      // suporta atat lista simpla cat si paginata
      if (res.data.results) {
        setConsultatii(res.data.results);
        setTotal(res.data.count);
      } else {
        setConsultatii(res.data);
        setTotal(res.data.length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [pagina, search]);

  useEffect(() => { fetchConsultatii(); }, [fetchConsultatii]);

  // debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPagina(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const totalPagini = Math.ceil(total / PER_PAGE);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Consultații</h1>
          <p className="text-sm text-gray-500 mt-1">{total} înregistrări totale</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Caută după pacient, medic, simptome..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Pacient</th>
              <th className="px-4 py-3 text-left">Medic</th>
              <th className="px-4 py-3 text-left">Simptome</th>
              <th className="px-4 py-3 text-left">Diagnostice</th>
              <th className="px-4 py-3 text-left">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  Se încarcă...
                </td>
              </tr>
            ) : consultatii.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  Nicio consultație găsită.
                </td>
              </tr>
            ) : consultatii.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                  {FORMAT_DATA(c.data_ora)}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/pacienti/${c.pacient}`)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {c.pacient_nume || `Pacient #${c.pacient}`}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {c.medic_nume || `Medic #${c.medic}`}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                  {c.simptome || "—"}
                </td>
                <td className="px-4 py-3">
                  {c.diagnostice?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {c.diagnostice.slice(0, 2).map((d, i) => (
                        <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                          {d.cod_icd10 || d.denumire}
                        </span>
                      ))}
                      {c.diagnostice.length > 2 && (
                        <span className="text-xs text-gray-400">+{c.diagnostice.length - 2}</span>
                      )}
                    </div>
                  ) : "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelected(c)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg transition"
                  >
                    Detalii
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginare */}
      {totalPagini > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Pagina {pagina} din {totalPagini}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPagina(p => Math.min(totalPagini, p + 1))}
              disabled={pagina === totalPagini}
              className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Următor →
            </button>
          </div>
        </div>
      )}

      {/* Modal detalii */}
      {selected && (
        <ModalConsultatie
          consultatie={selected}
          onClose={() => setSelected(null)}
          onNavigate={(id) => { setSelected(null); navigate(`/pacienti/${id}`); }}
        />
      )}
    </div>
  );
}

function ModalConsultatie({ consultatie: c, onClose, onNavigate }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800 text-lg">
            Consultație — {FORMAT_DATA(c.data_ora)}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Pacient">
              <button
                onClick={() => onNavigate(c.pacient)}
                className="text-blue-600 hover:underline"
              >
                {c.pacient_nume || `#${c.pacient}`}
              </button>
            </InfoRow>
            <InfoRow label="Medic">{c.medic_nume || `#${c.medic}`}</InfoRow>
          </div>

          {c.simptome && <InfoBlock label="Simptome" text={c.simptome} />}
          {c.examen_clinic && <InfoBlock label="Examen clinic" text={c.examen_clinic} />}
          {c.tratament && <InfoBlock label="Tratament" text={c.tratament} />}
          {c.observatii && <InfoBlock label="Observații" text={c.observatii} />}

          {c.diagnostice?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Diagnostice</p>
              <div className="flex flex-wrap gap-2">
                {c.diagnostice.map((d, i) => (
                  <span key={i} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
                    {d.cod_icd10} — {d.denumire}
                    {d.tip === "principal" && (
                      <span className="ml-1 text-xs opacity-60">(principal)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
      <p className="text-gray-800">{children}</p>
    </div>
  );
}

function InfoBlock({ label, text }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
      <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg px-3 py-2 text-sm">{text}</p>
    </div>
  );
}