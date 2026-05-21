import { useState, useMemo } from 'react'
import MEDICAMENTE from '../data/medicamente_dci.json'
import s from '../styles/MedicamentPicker.module.css'

export default function MedicamentPicker({ onSelect }) {
  const [open, setOpen]           = useState(false)
  const [cautare, setCautare]     = useState('')
  const [categorie, setCategorie] = useState('')
  const [dciAles, setDciAles]     = useState('')
  const [variantaIdx, setVariantaIdx] = useState('')

  const categorii = useMemo(() => {
    const set = new Set(MEDICAMENTE.map(m => m.clasa.split(' - ')[0].trim()))
    return [...set].sort()
  }, [])

  const dciList = useMemo(() => {
    let lista = MEDICAMENTE
    if (categorie) lista = lista.filter(m => m.clasa.split(' - ')[0].trim() === categorie)
    if (cautare.trim()) {
      const q = cautare.trim().toLowerCase()
      lista = lista.filter(m => m.dci.toLowerCase().includes(q))
    }
    const set = new Set(lista.map(m => m.dci))
    return [...set].sort()
  }, [categorie, cautare])

  const variante = useMemo(() => {
    if (!dciAles) return []
    return MEDICAMENTE.filter(m => m.dci === dciAles)
  }, [dciAles])

  const handleSelectDci = (dci) => {
    setDciAles(dci)
    setVariantaIdx('')
  }

  const handleApply = () => {
    if (!dciAles || variantaIdx === '') return
    const med = variante[parseInt(variantaIdx)]
    onSelect({
      nume_medicament: med.dci,
      concentratie: `${med.forma} ${med.concentratie}`,
    })
    resetSiInchide()
  }

  const resetSiInchide = () => {
    setOpen(false)
    setCautare('')
    setCategorie('')
    setDciAles('')
    setVariantaIdx('')
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={s.btnDeschide}>
        Alege DCI din formularul național
      </button>
    )
  }

  return (
    <div className={s.picker}>
      <div className={s.pickerHeader}>
        <span className={s.pickerTitlu}>Formular național DCI</span>
        <button type="button" onClick={resetSiInchide} className={s.btnInchide}>✕</button>
      </div>

      <div className={s.pickerCorpus}>
        {/* Căutare liberă */}
        <div className={s.rand}>
          <label className={s.eticheta}>Caută substanță activă</label>
          <input
            value={cautare}
            onChange={e => { setCautare(e.target.value); setDciAles(''); setVariantaIdx('') }}
            placeholder="ex: Enalapril, Metformin..."
            className={s.input}
            autoFocus
          />
        </div>

        {/* Filtru categorie */}
        <div className={s.rand}>
          <label className={s.eticheta}>Filtrează după categorie terapeutică</label>
          <select
            value={categorie}
            onChange={e => { setCategorie(e.target.value); setDciAles(''); setVariantaIdx('') }}
            className={s.input}
          >
            <option value="">— toate categoriile —</option>
            {categorii.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Listă DCI */}
        {dciList.length > 0 && (
          <div className={s.rand}>
            <label className={s.eticheta}>
              Substanță activă (DCI)
              <span className={s.contor}>{dciList.length} rezultate</span>
            </label>
            <div className={s.dciLista}>
              {dciList.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelectDci(d)}
                  className={`${s.dciBton} ${dciAles === d ? s.dciBtonActiv : ''}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {dciList.length === 0 && (cautare || categorie) && (
          <p className={s.golit}>Niciun DCI găsit pentru filtrele selectate.</p>
        )}

        {/* Selector formă / concentrație */}
        {dciAles && (
          <div className={s.rand}>
            <label className={s.eticheta}>Formă și concentrație</label>
            <select
              value={variantaIdx}
              onChange={e => setVariantaIdx(e.target.value)}
              className={s.input}
            >
              <option value="">— selectați forma —</option>
              {variante.map((v, idx) => (
                <option key={idx} value={idx}>
                  {v.forma} · {v.concentratie} ({v.cale})
                </option>
              ))}
            </select>
          </div>
        )}

        {dciAles && variantaIdx !== '' && (
          <button type="button" onClick={handleApply} className={s.btnAplica}>
            Aplică selecția
          </button>
        )}
      </div>
    </div>
  )
}
