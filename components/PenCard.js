'use client'

export default function PenCard({ stylo, owned, ownerLabel, onToggle, toggleable, isAdmin, onEdit, onDelete }) {
  return (
    <div style={{ ...styles.card, ...(owned ? styles.cardOwned : {}) }}>
      <div style={styles.imageWrap}>
        {stylo.image_url ? (
          <img
            src={stylo.image_url}
            alt={stylo.nom}
            style={{
              ...styles.image,
              filter: owned ? 'none' : 'grayscale(1) brightness(0.9) contrast(0.9)',
              opacity: owned ? 1 : 0.55,
            }}
          />
        ) : (
          <div style={{ ...styles.placeholder, filter: owned ? 'none' : 'grayscale(1)' }}>✒️</div>
        )}
        {owned && <span style={styles.badge}>capturé</span>}
      </div>

      <div style={styles.body}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{stylo.nom}</h3>
        {stylo.collection && (
          <p style={styles.meta}>{stylo.collection}{stylo.motif ? ` · ${stylo.motif}` : ''}</p>
        )}
        {owned && ownerLabel && (
          <p style={{ ...styles.meta, color: 'var(--teal)', fontWeight: 600 }}>{ownerLabel}</p>
        )}
      </div>

      {isAdmin && (
        <div style={{ display: 'flex', gap: 6, margin: '0 12px 12px' }}>
          <button onClick={() => onEdit(stylo)} style={styles.btnEdit}>Modifier</button>
          <button onClick={() => onDelete(stylo)} style={styles.btnDelete}>Supprimer</button>
        </div>
      )}

      {toggleable && (
        <button
          onClick={() => onToggle(stylo, !owned)}
          style={owned ? styles.btnRemove : styles.btnAdd}
        >
          {owned ? 'Retirer' : 'Marquer comme possédé'}
        </button>
      )}
    </div>
  )
}

const styles = {
  card: {
    background: 'var(--card-bg)',
    border: '1px solid var(--paper-line)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  cardOwned: {
    borderColor: 'var(--teal)',
    boxShadow: '0 4px 14px rgba(47,111,99,0.12)',
  },
  imageWrap: {
    position: 'relative',
    background: '#F1ECE2',
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  placeholder: {
    fontSize: 36,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'var(--teal)',
    color: 'white',
    fontSize: 10,
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: 999,
  },
  body: {
    padding: '10px 12px',
    flex: 1,
  },
  meta: {
    fontSize: 12,
    color: 'var(--ink-soft)',
    margin: '2px 0 0',
  },
  btnAdd: {
    margin: 12,
    marginTop: 0,
    background: 'var(--teal)',
    color: 'white',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: 600,
  },
  btnRemove: {
    margin: 12,
    marginTop: 0,
    background: 'transparent',
    border: '1px solid var(--paper-line)',
    color: 'var(--ink-soft)',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: 500,
  },
  btnEdit: {
    flex: 1,
    background: 'transparent',
    border: '1px solid var(--paper-line)',
    color: 'var(--ink-soft)',
    borderRadius: 8,
    padding: '6px 8px',
    fontSize: 11,
    fontWeight: 600,
  },
  btnDelete: {
    flex: 1,
    background: 'transparent',
    border: '1px solid var(--raspberry)',
    color: 'var(--raspberry)',
    borderRadius: 8,
    padding: '6px 8px',
    fontSize: 11,
    fontWeight: 600,
  },
}
