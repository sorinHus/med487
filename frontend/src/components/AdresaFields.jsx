// src/components/AdresaFields.jsx
import { useMemo } from 'react';
import { JUDETE, LOCALITATI_BY_JUDET } from '../utils/romania_geo';

const S = {
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' },
  rowAdresa: { display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '12px', marginBottom: '12px' },
  label: { display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '500' },
  select: { width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', padding: '8px 10px', fontSize: '14px', outline: 'none', cursor: 'pointer' },
  input: { width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', padding: '8px 10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  inputDisabled: { opacity: 0.5, cursor: 'not-allowed' },
}

export default function AdresaFields({ values = {}, onChange, disabled = false, errors = {} }) {
  const { judet = '', localitate = '', strada = '', numar_strada = '' } = values

  const localitati = useMemo(() => {
    if (!judet) return []
    return LOCALITATI_BY_JUDET[judet] || []
  }, [judet])

  const handleJudetChange = (e) => {
    onChange('judet', e.target.value)
    onChange('localitate', '')
  }

  const errorStyle = (field) => errors[field] ? { borderColor: '#ef4444' } : {}

  return (
    <>
      <div style={S.row}>
        <div>
          <label style={S.label}>Județ</label>
          <select value={judet} onChange={handleJudetChange} disabled={disabled} style={{ ...S.select, ...errorStyle('judet') }}>
            <option value="">— Selectează județul —</option>
            {JUDETE.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
          {errors.judet && <span style={{ color: '#ef4444', fontSize: '11px' }}>{errors.judet}</span>}
        </div>
        <div>
          <label style={S.label}>Localitate</label>
          <select value={localitate} onChange={e => onChange('localitate', e.target.value)} disabled={disabled || !judet}
            style={{ ...S.select, ...errorStyle('localitate'), ...(disabled || !judet ? S.inputDisabled : {}) }}>
            <option value="">{!judet ? '— Selectează mai întâi județul —' : '— Selectează localitatea —'}</option>
            {localitati.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {errors.localitate && <span style={{ color: '#ef4444', fontSize: '11px' }}>{errors.localitate}</span>}
        </div>
      </div>
      <div style={S.rowAdresa}>
        <div>
          <label style={S.label}>Strada</label>
          <input type="text" value={strada} onChange={e => onChange('strada', e.target.value)} disabled={disabled} placeholder="ex: Str. Mihai Eminescu" style={{ ...S.input, ...errorStyle('strada') }} />
          {errors.strada && <span style={{ color: '#ef4444', fontSize: '11px' }}>{errors.strada}</span>}
        </div>
        <div>
          <label style={S.label}>Număr</label>
          <input type="text" value={numar_strada} onChange={e => onChange('numar_strada', e.target.value)} disabled={disabled} placeholder="ex: 12A" style={{ ...S.input, ...errorStyle('numar_strada') }} />
          {errors.numar_strada && <span style={{ color: '#ef4444', fontSize: '11px' }}>{errors.numar_strada}</span>}
        </div>
      </div>
    </>
  )
}