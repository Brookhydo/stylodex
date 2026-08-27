"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, X, Droplet, Heart, Pencil, Trash2, ChevronDown, Feather, Loader2, LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const INK_TYPES = [
  { id: "plume", label: "Plume", color: "#2F6F4F" },
  { id: "bille", label: "Bille", color: "#2A4D69" },
  { id: "gel", label: "Gel", color: "#6B4E9E" },
  { id: "roller", label: "Roller", color: "#C9752F" },
  { id: "feutre", label: "Feutre / Marqueur", color: "#B5533C" },
  { id: "autre", label: "Autre", color: "#6B7280" },
];
const inkMeta = (id) => INK_TYPES.find((t) => t.id === id) || INK_TYPES[INK_TYPES.length - 1];

const emptyForm = {
  name: "", brand: "", inkType: "plume", inkColor: "", swatchHex: "#2F6F4F",
  nibSize: "", acquiredDate: "", price: "", rating: 3, status: "possede",
  favorite: false, notes: "", imageUrl: "",
};

const fromDb = (row) => ({
  id: row.id,
  catalogNumber: row.catalog_number,
  name: row.name,
  brand: row.brand,
  inkType: row.ink_type,
  inkColor: row.ink_color,
  swatchHex: row.swatch_hex,
  nibSize: row.nib_size,
  acquiredDate: row.acquired_date || "",
  price: row.price,
  rating: row.rating,
  status: row.status,
  favorite: row.favorite,
  notes: row.notes,
  imageUrl: row.image_url,
});

const toDb = (form) => ({
  name: form.name,
  brand: form.brand,
  ink_type: form.inkType,
  ink_color: form.inkColor,
  swatch_hex: form.swatchHex,
  nib_size: form.nibSize,
  acquired_date: form.acquiredDate || null,
  price: form.price,
  rating: form.rating,
  status: form.status,
  favorite: form.favorite,
  notes: form.notes,
  image_url: form.imageUrl,
});

function formatPrice(p) {
  const n = parseFloat(p);
  if (isNaN(n)) return "";
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
}
function formatDate(d) {
  if (!d) return "";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}
function withAlpha(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function Catalogue({ userEmail }) {
  const router = useRouter();
  const supabase = createClient();

  const [pens, setPens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [openId, setOpenId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("pens").select("*").order("created_at", { ascending: false });
      if (error) setErrorMsg("Impossible de charger le catalogue. Recharge la page.");
      else setPens((data || []).map(fromDb));
      setLoading(false);
    })();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setFormError(""); setFormOpen(true); };
  const openEdit = (pen) => {
    setEditingId(pen.id);
    setForm({ ...emptyForm, ...pen, price: pen.price != null ? String(pen.price) : "" });
    setFormError(""); setFormOpen(true); setOpenId(null);
  };
  const closeForm = () => { setFormOpen(false); setEditingId(null); setForm(emptyForm); setFormError(""); };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.brand.trim()) {
      setFormError("Le nom du modèle et la marque sont indispensables pour ficher ce spécimen.");
      return;
    }
    const priceNum = form.price === "" ? null : parseFloat(String(form.price).replace(",", "."));
    if (form.price !== "" && isNaN(priceNum)) {
      setFormError("Le prix doit être un nombre.");
      return;
    }

    if (editingId) {
      const { data, error } = await supabase
        .from("pens").update(toDb({ ...form, price: priceNum })).eq("id", editingId).select().single();
      if (error) { setFormError("La sauvegarde a échoué. Réessaie."); return; }
      setPens(pens.map((p) => (p.id === editingId ? fromDb(data) : p)));
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const nextNumber = pens.length ? Math.max(...pens.map((p) => p.catalogNumber || 0)) + 1 : 1;
      const { data, error } = await supabase
        .from("pens")
        .insert({ ...toDb({ ...form, price: priceNum }), catalog_number: nextNumber, user_id: user.id })
        .select().single();
      if (error) { setFormError("L'ajout a échoué. Réessaie."); return; }
      setPens([fromDb(data), ...pens]);
    }
    closeForm();
  };

  const toggleFavorite = async (id) => {
    const pen = pens.find((p) => p.id === id);
    const next = !pen.favorite;
    setPens(pens.map((p) => (p.id === id ? { ...p, favorite: next } : p)));
    const { error } = await supabase.from("pens").update({ favorite: next }).eq("id", id);
    if (error) setErrorMsg("La mise à jour a échoué.");
  };

  const doDelete = async (id) => {
    const { error } = await supabase.from("pens").delete().eq("id", id);
    if (error) { setErrorMsg("La suppression a échoué."); return; }
    setPens(pens.filter((p) => p.id !== id));
    setConfirmDelete(null); setOpenId(null);
  };

  const filtered = useMemo(() => {
    let list = [...pens];
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) =>
      p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || (p.inkColor || "").toLowerCase().includes(q)
    );
    if (filterType !== "all") list = list.filter((p) => p.inkType === filterType);
    if (filterStatus !== "all") list = list.filter((p) => p.status === filterStatus);
    switch (sortBy) {
      case "rating": list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case "brand": list.sort((a, b) => a.brand.localeCompare(b.brand)); break;
      case "number": list.sort((a, b) => (a.catalogNumber || 0) - (b.catalogNumber || 0)); break;
      default: break;
    }
    return list;
  }, [pens, query, filterType, filterStatus, sortBy]);

  const stats = useMemo(() => {
    const total = pens.length;
    const owned = pens.filter((p) => p.status === "possede").length;
    const wishlist = pens.filter((p) => p.status === "souhait").length;
    const totalValue = pens.filter((p) => p.status === "possede" && typeof p.price === "number")
      .reduce((sum, p) => sum + p.price, 0);
    return { total, owned, wishlist, totalValue };
  }, [pens]);

  return (
    <div className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
      <header className="mb-7">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <Feather size={26} strokeWidth={1.5} className="text-brass" />
            <h1 className="font-display text-3xl font-semibold">Le Plumier</h1>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 text-xs text-paperDark2 hover:text-paper">
            <LogOut size={14} /> {userEmail}
          </button>
        </div>
        <p className="font-mono text-xs text-paperDark2 ml-9 mt-0.5">Catalogue de spécimens — stylos, plumes &amp; encres</p>
        <div className="h-[3px] mt-4 border-t border-b border-brass opacity-50" />
        <div className="flex gap-7 mt-4 flex-wrap">
          <Stat label="Répertoriés" value={stats.total} />
          <Stat label="En collection" value={stats.owned} />
          <Stat label="Sur la liste" value={stats.wishlist} />
          <Stat label="Valeur collection" value={formatPrice(stats.totalValue) || "0 €"} />
        </div>
      </header>

      <div className="flex gap-2.5 flex-wrap items-center mb-5">
        <div className="flex items-center gap-2 bg-navyDeep border border-paperDark3 rounded-lg px-3 py-2 flex-1 min-w-[180px]">
          <Search size={16} className="text-paperDark3 shrink-0" />
          <input
            className="bg-transparent outline-none text-sm w-full"
            placeholder="Chercher un modèle, une marque, une teinte…"
            value={query} onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={filterType} onChange={setFilterType} options={[{ id: "all", label: "Tous les types" }, ...INK_TYPES]} />
        <Select value={filterStatus} onChange={setFilterStatus} options={[
          { id: "all", label: "Tous les statuts" }, { id: "possede", label: "Possédés" }, { id: "souhait", label: "Liste de souhaits" },
        ]} />
        <Select value={sortBy} onChange={setSortBy} options={[
          { id: "recent", label: "Plus récents" }, { id: "number", label: "N° de catalogue" },
          { id: "rating", label: "Meilleure note" }, { id: "brand", label: "Marque (A→Z)" },
        ]} />
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-teal hover:bg-tealDark rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap">
          <Plus size={16} strokeWidth={2.5} /> Ajouter un spécimen
        </button>
      </div>

      {errorMsg && <div className="bg-rust/20 border border-rust text-red-200 rounded-lg px-3.5 py-2.5 text-sm mb-4">{errorMsg}</div>}

      {loading ? (
        <div className="flex flex-col items-center gap-2 py-16 text-paperDark2">
          <Loader2 size={22} className="animate-spin text-brass" />
          <p className="text-sm">Ouverture du carnet…</p>
        </div>
      ) : pens.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-paperDark2">
          <Feather size={30} strokeWidth={1.2} className="text-brass" />
          <p className="font-display italic text-xl text-paper">Le carnet est vierge</p>
          <p className="text-sm max-w-xs">Fiche le premier spécimen de la collection pour ouvrir le catalogue.</p>
          <button onClick={openAdd} className="mt-3 flex items-center gap-1.5 bg-teal hover:bg-tealDark rounded-lg px-4 py-2.5 text-sm font-medium">
            <Plus size={16} strokeWidth={2.5} /> Ajouter un spécimen
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-paperDark2 text-sm py-16">Aucun spécimen ne correspond à ces filtres.</p>
      ) : (
        <div className="grid gap-4.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 18 }}>
          {filtered.map((pen) => (
            <PenCard key={pen.id} pen={pen} open={openId === pen.id}
              onToggleOpen={() => setOpenId(openId === pen.id ? null : pen.id)}
              onEdit={() => openEdit(pen)} onDelete={() => setConfirmDelete(pen.id)}
              onFavorite={() => toggleFavorite(pen.id)} />
          ))}
        </div>
      )}

      {formOpen && (
        <FormModal form={form} setForm={setForm} onSubmit={submitForm} onClose={closeForm} isEdit={!!editingId} error={formError} />
      )}
      {confirmDelete && (
        <ConfirmModal penName={pens.find((p) => p.id === confirmDelete)?.name}
          onCancel={() => setConfirmDelete(null)} onConfirm={() => doDelete(confirmDelete)} />
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="font-mono text-xl font-medium text-brass">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-paperDark2">{label}</div>
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <div className="relative inline-flex">
      <select
        className="appearance-none bg-navyDeep border border-paperDark3 rounded-lg text-paper text-sm pl-3 pr-7 py-2 cursor-pointer"
        value={value} onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-paperDark3" />
    </div>
  );
}

function PenCard({ pen, open, onToggleOpen, onEdit, onDelete, onFavorite }) {
  const meta = inkMeta(pen.inkType);
  const swatch = pen.swatchHex || meta.color;
  return (
    <div className="bg-paper text-ink rounded-[10px] overflow-hidden flex shadow-lg">
      <div className="w-[7px] shrink-0" style={{ background: swatch }} />
      <div className="p-4 pt-3.5 flex-1 flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <span className="font-mono text-[11px] tracking-wide text-paperDark3">N° {String(pen.catalogNumber).padStart(3, "0")}</span>
          <button aria-label="Marquer comme favori" onClick={onFavorite} className="p-1">
            <Heart size={16} color={pen.favorite ? "#B5533C" : "#8C8471"} fill={pen.favorite ? "#B5533C" : "none"} />
          </button>
        </div>

        {pen.imageUrl ? (
          <img src={pen.imageUrl} alt={pen.name} className="w-full h-[110px] object-cover rounded-md my-0.5" onError={(e) => (e.target.style.display = "none")} />
        ) : null}

        <h3 className="font-display text-lg font-semibold leading-tight">{pen.name}</h3>
        <p className="text-xs text-[#6B5F4B] uppercase tracking-wide">{pen.brand}</p>

        <div className="flex gap-1.5 flex-wrap mt-1">
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: withAlpha(meta.color, 0.14), color: meta.color }}>{meta.label}</span>
          <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${pen.status === "possede" ? "bg-green-800/20 text-green-700" : "bg-rust/20 text-rust"}`}>
            {pen.status === "possede" ? "Possédé" : "Souhait"}
          </span>
        </div>

        <div className="flex gap-0.5 mt-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Droplet key={n} size={14} color="#C9A227" fill={n <= (pen.rating || 0) ? "#C9A227" : "none"} />
          ))}
        </div>

        <button onClick={onToggleOpen} className="flex items-center justify-center gap-1.5 mt-2 border border-paperDark2 rounded-md py-1.5 text-xs text-[#6B5F4B]">
          {open ? "Refermer la fiche" : "Voir la fiche"}
          <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }} />
        </button>

        {open && (
          <div className="mt-1.5 pt-2.5 border-t border-dashed border-paperDark2 flex flex-col gap-1.5">
            <DetailRow label="Encre" value={pen.inkColor || "—"} />
            <DetailRow label="Pointe" value={pen.nibSize || "—"} />
            <DetailRow label="Acquis le" value={formatDate(pen.acquiredDate) || "—"} />
            <DetailRow label="Prix" value={formatPrice(pen.price) || "—"} />
            {pen.notes && (
              <div className="mt-0.5">
                <span className="text-[10.5px] uppercase tracking-wide text-[#8C8471]">Notes</span>
                <p className="text-xs italic text-[#4A4030] mt-0.5">{pen.notes}</p>
              </div>
            )}
            <div className="flex gap-3 mt-1.5">
              <button onClick={onEdit} className="flex items-center gap-1.5 text-xs text-teal"><Pencil size={13} /> Modifier</button>
              <button onClick={onDelete} className="flex items-center gap-1.5 text-xs text-rust"><Trash2 size={13} /> Retirer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-[10.5px] uppercase tracking-wide text-[#8C8471]">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function FormModal({ form, setForm, onSubmit, onClose, isEdit, error }) {
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-5 z-50" onClick={onClose}>
      <div className="bg-paper text-ink rounded-xl p-6 w-full max-w-lg max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="font-display text-xl font-semibold">{isEdit ? "Modifier le spécimen" : "Nouveau spécimen"}</h2>
          <button aria-label="Fermer" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={onSubmit} className="mt-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom du modèle *" span={2}><input className="input" value={form.name} onChange={set("name")} placeholder="Ex. Safari" /></Field>
            <Field label="Marque *"><input className="input" value={form.brand} onChange={set("brand")} placeholder="Ex. Lamy" /></Field>
            <Field label="Type">
              <select className="input" value={form.inkType} onChange={set("inkType")}>
                {INK_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Couleur d'encre"><input className="input" value={form.inkColor} onChange={set("inkColor")} placeholder="Ex. Bleu nuit" /></Field>
            <Field label="Teinte (repère)"><input type="color" className="input h-9 p-1 cursor-pointer" value={form.swatchHex} onChange={set("swatchHex")} /></Field>
            <Field label="Pointe"><input className="input" value={form.nibSize} onChange={set("nibSize")} placeholder="Ex. F, 0.5mm" /></Field>
            <Field label="Statut">
              <select className="input" value={form.status} onChange={set("status")}>
                <option value="possede">Possédé</option>
                <option value="souhait">Liste de souhaits</option>
              </select>
            </Field>
            <Field label="Acquis le"><input type="date" className="input" value={form.acquiredDate} onChange={set("acquiredDate")} /></Field>
            <Field label="Prix (€)"><input className="input" value={form.price} onChange={set("price")} placeholder="Ex. 32.90" inputMode="decimal" /></Field>
            <Field label="Note" span={2}>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} aria-label={`${n} sur 5`} onClick={() => setForm({ ...form, rating: n })} className="p-0.5">
                    <Droplet size={20} color="#C9A227" fill={n <= form.rating ? "#C9A227" : "none"} />
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Image (URL, optionnel)" span={2}><input className="input" value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://…" /></Field>
            <Field label="Notes" span={2}><textarea className="input min-h-[70px] resize-y" value={form.notes} onChange={set("notes")} placeholder="Sensations d'écriture, occasion d'achat, anecdotes…" /></Field>
          </div>
          {error && <div className="mt-3 bg-rust/15 border border-rust text-[#8A3A28] rounded-md px-3 py-2 text-xs">{error}</div>}
          <div className="flex justify-end gap-2.5 mt-4.5" style={{ marginTop: 18 }}>
            <button type="button" onClick={onClose} className="border border-paperDark3 text-[#6B5F4B] rounded-lg px-4 py-2.5 text-sm">Annuler</button>
            <button type="submit" className="bg-teal text-paper rounded-lg px-4 py-2.5 text-sm font-medium">{isEdit ? "Enregistrer" : "Ajouter au catalogue"}</button>
          </div>
        </form>
      </div>
      <style jsx global>{`
        .input {
          border: 1px solid #C9BFA3;
          border-radius: 7px;
          padding: 8px 10px;
          font-size: 13.5px;
          background: #FFFDF8;
          color: #2A2016;
          width: 100%;
          outline: none;
        }
        .input:focus { border-color: #C9A227; }
      `}</style>
    </div>
  );
}

function Field({ label, children, span }) {
  return (
    <label className={`flex flex-col gap-1 ${span === 2 ? "col-span-2" : "col-span-1"}`}>
      <span className="text-[11.5px] text-[#6B5F4B] font-medium">{label}</span>
      {children}
    </label>
  );
}

function ConfirmModal({ penName, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-5 z-50" onClick={onCancel}>
      <div className="bg-paper text-ink rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-semibold">Retirer ce spécimen ?</h2>
        <p className="text-sm text-[#6B5F4B] mt-2">« {penName} » sera définitivement retiré du catalogue.</p>
        <div className="flex justify-end gap-2.5 mt-5">
          <button onClick={onCancel} className="border border-paperDark3 text-[#6B5F4B] rounded-lg px-4 py-2.5 text-sm">Annuler</button>
          <button onClick={onConfirm} className="bg-rust text-paper rounded-lg px-4 py-2.5 text-sm font-medium">Retirer</button>
        </div>
      </div>
    </div>
  );
}
