'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import PenCard from '@/components/PenCard'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [stylos, setStylos] = useState([])
  const [possessions, setPossessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStylo, setEditingStylo] = useState(null)
  const [viewedUserId, setViewedUserId] = useState(null)
  const [search, setSearch] = useState('')
  const [activeCollection, setActiveCollection] = useState('toutes')
  const [ownedFilter, setOwnedFilter] = useState('tous') // 'tous' | 'possedes' | 'non-possedes'

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      setUser(session.user)
      setViewedUserId(session.user.id)
      await loadAll()
      setLoading(false)
    }
    init()
  }, [router])

  async function loadAll() {
    const [{ data: s }, { data: p }, { data: pr }] = await Promise.all([
      supabase.from('stylos').select('*'),
      supabase.from('possessions').select('*'),
      supabase.from('profiles').select('*'),
    ])
    setStylos(s || [])
    setPossessions(p || [])
    setProfiles(pr || [])
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  async function toggleOwnership(stylo, shouldOwn) {
    if (!user) return
    if (shouldOwn) {
      const { error } = await supabase
        .from('possessions')
        .insert({ utilisateur_id: user.id, stylo_id: stylo.id })
      if (!error) {
        setPossessions((prev) => [...prev, { utilisateur_id: user.id, stylo_id: stylo.id, id: crypto.randomUUID() }])
      }
    } else {
      await supabase
        .from('possessions')
        .delete()
        .eq('utilisateur_id', user.id)
        .eq('stylo_id', stylo.id)
      setPossessions((prev) => prev.filter((p) => !(p.utilisateur_id === user.id && p.stylo_id === stylo.id)))
    }
  }

  async function handleAddStylo(e) {
    e.preventDefault()
    const form = e.target
    const nouveau = {
      nom: form.nom.value,
      collection: form.collection.value || null,
      motif: form.motif.value || null,
      couleur_encre: form.couleur_encre.value || null,
      type: form.type.value || null,
      image_url: form.image_url.value || null,
    }
    const { data, error } = await supabase.from('stylos').insert(nouveau).select().single()
    if (!error && data) {
      setStylos((prev) => [...prev, data])
      setShowAddForm(false)
      form.reset()
    }
  }

  async function handleUpdateStylo(e) {
    e.preventDefault()
    const form = e.target
    const updates = {
      nom: form.nom.value,
      collection: form.collection.value || null,
      motif: form.motif.value || null,
      couleur_encre: form.couleur_encre.value || null,
      type: form.type.value || null,
      image_url: form.image_url.value || null,
    }
    const { data, error } = await supabase
      .from('stylos')
      .update(updates)
      .eq('id', editingStylo.id)
      .select()
      .single()
    if (!error && data) {
      setStylos((prev) => prev.map((s) => (s.id === data.id ? data : s)))
      setEditingStylo(null)
    } else if (error) {
      alert("La modification a échoué : " + error.message)
    }
  }

  async function handleDeleteStylo(stylo) {
    if (!confirm(`Supprimer définitivement "${stylo.nom}" du catalogue ?`)) return
    const { error } = await supabase.from('stylos').delete().eq('id', stylo.id)
    if (!error) {
      setStylos((prev) => prev.filter((s) => s.id !== stylo.id))
      setPossessions((prev) => prev.filter((p) => p.stylo_id !== stylo.id))
    } else {
      alert("La suppression a échoué : " + error.message)
    }
  }

  const ownedByViewed = useMemo(
    () => new Set(possessions.filter((p) => p.utilisateur_id === viewedUserId).map((p) => p.stylo_id)),
    [possessions, viewedUserId]
  )
  const isViewingSelf = viewedUserId === user?.id

  const collections = useMemo(() => {
    const uniques = new Set(stylos.map((s) => s.collection).filter(Boolean))
    return Array.from(uniques).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [stylos])

  const displayedStylos = useMemo(() => {
    let list = stylos

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((s) => s.nom.toLowerCase().includes(q) || (s.collection || '').toLowerCase().includes(q))
    }

    if (activeCollection !== 'toutes') {
      list = list.filter((s) => s.collection === activeCollection)
    }

    if (ownedFilter === 'possedes') {
      list = list.filter((s) => ownedByViewed.has(s.id))
    } else if (ownedFilter === 'non-possedes') {
      list = list.filter((s) => !ownedByViewed.has(s.id))
    }

    return [...list].sort((a, b) => {
      if (ownedFilter === 'tous') {
        const aOwned = ownedByViewed.has(a.id) ? 0 : 1
        const bOwned = ownedByViewed.has(b.id) ? 0 : 1
        if (aOwned !== bOwned) return aOwned - bOwned
      }
      return a.nom.localeCompare(b.nom, 'fr')
    })
  }, [stylos, search, activeCollection, ownedFilter, ownedByViewed])

  const capturedCount = ownedByViewed.size
  const isAdmin = profiles.find((p) => p.id === user?.id)?.is_admin === true

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: 'var(--ink-soft)' }}>Ouverture du carnet…</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 20px 60px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <img src="/logo.png" alt="Stylodex" style={{ height: 90 }} />
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, margin: '4px 0 0' }}>
            {capturedCount} / {stylos.length} stylos capturés
            {!isViewingSelf && ` par ${profiles.find((p) => p.id === viewedUserId)?.pseudo || ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            className="field"
            value={viewedUserId || ''}
            onChange={(e) => setViewedUserId(e.target.value)}
            style={{ width: 'auto' }}
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id === user?.id ? `${p.pseudo} (moi)` : p.pseudo}
              </option>
            ))}
          </select>
          <button className="btn-ghost" onClick={handleLogout}>Se déconnecter</button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Pill active={activeCollection === 'toutes'} onClick={() => setActiveCollection('toutes')}>Toutes</Pill>
        {collections.map((c) => (
          <Pill key={c} active={activeCollection === c} onClick={() => setActiveCollection(c)}>{c}</Pill>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <Pill active={ownedFilter === 'tous'} onClick={() => setOwnedFilter('tous')} subtle>Tous</Pill>
        <Pill active={ownedFilter === 'possedes'} onClick={() => setOwnedFilter('possedes')} subtle>Possédés</Pill>
        <Pill active={ownedFilter === 'non-possedes'} onClick={() => setOwnedFilter('non-possedes')} subtle>Non possédés</Pill>
        <div style={{ flex: 1 }} />
        <input
          className="field"
          placeholder="Rechercher un stylo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <button className="btn-primary" onClick={() => setShowAddForm((v) => !v)}>
          {showAddForm ? 'Annuler' : '+ Ajouter un stylo'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddStylo} style={styles.addForm}>
          <input className="field" name="nom" placeholder="Nom du stylo *" required />
          <input className="field" name="collection" placeholder="Collection (ex. Legami, Bic…)" />
          <input className="field" name="motif" placeholder="Motif (ex. Lapin)" />
          <input className="field" name="couleur_encre" placeholder="Couleur d'encre" />
          <input className="field" name="type" placeholder="Type (gel, bille, feutre…)" />
          <input className="field" name="image_url" placeholder="Lien vers une photo (URL)" />
          <button className="btn-primary" type="submit" style={{ gridColumn: '1 / -1' }}>Ajouter au catalogue</button>
        </form>
      )}

      {editingStylo && (
        <form onSubmit={handleUpdateStylo} style={styles.addForm}>
          <input className="field" name="nom" defaultValue={editingStylo.nom} placeholder="Nom du stylo *" required />
          <input className="field" name="collection" defaultValue={editingStylo.collection || ''} placeholder="Collection (ex. Legami, Bic…)" />
          <input className="field" name="motif" defaultValue={editingStylo.motif || ''} placeholder="Motif (ex. Lapin)" />
          <input className="field" name="couleur_encre" defaultValue={editingStylo.couleur_encre || ''} placeholder="Couleur d'encre" />
          <input className="field" name="type" defaultValue={editingStylo.type || ''} placeholder="Type (gel, bille, feutre…)" />
          <input className="field" name="image_url" defaultValue={editingStylo.image_url || ''} placeholder="Lien vers une photo (URL)" />
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
            <button className="btn-primary" type="submit">Enregistrer les modifications</button>
            <button type="button" className="btn-ghost" onClick={() => setEditingStylo(null)}>Annuler</button>
          </div>
        </form>
      )}

      {displayedStylos.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)' }}>Aucun stylo ne correspond à ces filtres.</p>
      ) : (
        <div style={styles.grid}>
          {displayedStylos.map((s) => (
            <PenCard
              key={s.id}
              stylo={s}
              owned={ownedByViewed.has(s.id)}
              toggleable={isViewingSelf}
              onToggle={toggleOwnership}
              isAdmin={isViewingSelf && isAdmin}
              onEdit={setEditingStylo}
              onDelete={handleDeleteStylo}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Pill({ active, children, onClick, subtle }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        background: active ? (subtle ? 'var(--raspberry)' : 'var(--teal)') : 'transparent',
        color: active ? 'white' : 'var(--ink-soft)',
        border: active ? 'none' : '1px solid var(--paper-line)',
      }}
    >
      {children}
    </button>
  )
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 16,
  },
  addForm: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 10,
    background: 'var(--card-bg)',
    border: '1px solid var(--paper-line)',
    borderRadius: 'var(--radius)',
    padding: 16,
    marginBottom: 24,
  },
}
