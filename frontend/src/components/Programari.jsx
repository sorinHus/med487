/* ════════════════════════════════════════════
   MODAL EDITARE PROGRAMARE (MOBIL)
════════════════════════════════════════════ */
function ModalEditareMobil({ token, user, programare, onClose, onSaved }) {
  const dataOraInit = new Date(programare.data_ora)
  const dateInit    = new Date(dataOraInit)
  const oraInit     = `${String(dataOraInit.getHours()).padStart(2,'0')}:${String(dataOraInit.getMinutes()).padStart(2,'0')}`

  const [step, setStep]       = useState('form') // form → slot → saving
  const [slots, setSlots]     = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotSel, setSlotSel] = useState(oraInit)
  const [data, setData]       = useState(dateInit)
  const [nume, setNume]       = useState(programare.nume_pacient || programare.pacient_nume_complet || '')
  const [telefon, setTelefon] = useState(programare.telefon_pacient || '')
  const [motiv, setMotiv]     = useState(programare.motiv || '')
  const [status, setStatus]   = useState(programare.status || 'programat')
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  const azi = new Date()
  const zileRapide = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(azi); d.setDate(azi.getDate() + i); zileRapide.push(d)
  }

  const fetchSlots = async (d) => {
    setLoadingSlots(true); setSlots([])
    try {
      const res = await apiFetch(`/programari/slots_libere/?data=${toDateStr(d)}&medic=${user.id}`, token)
      // slotul original e mereu liber
      const dateStr = toDateStr(d)
      const origDate = toDateStr(new Date(programare.data_ora))
      setSlots(res.map(sl => dateStr === origDate && sl.ora === oraInit ? { ...sl, liber: true } : sl))
    } catch { setErr('Nu s-au putut încărca sloturile.') }
    setLoadingSlots(false)
  }

  const handleSave = async () => {
    if (!nume.trim()) { setErr('Numele este obligatoriu.'); return }
    setSaving(true); setErr('')
    try {
      const [h, m] = slotSel.split(':')
      const dt = new Date(data); dt.setHours(parseInt(h), parseInt(m), 0, 0)
      await apiFetch(`/programari/${programare.id}/`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          data_ora: dt.toISOString(),
          nume_pacient: nume.trim(),
          telefon_pacient: telefon.trim(),
          motiv: motiv.trim(),
          status,
          medic: user.id,
        })
      })
      onSaved()
    } catch { setErr('Eroare la salvare. Încearcă din nou.') }
    setSaving(false)
  }

  return (
    <div className={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>
        <div className={s.modalHeader}>
          <div className={s.modalTitle}>✏️ Editare programare</div>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>

        {err && <div className={s.loginErr} style={{ margin: '0 16px 8px' }}>{err}</div>}

        {step === 'form' && (
          <div className={s.modalBody}>
            <div className={s.slotSel}>
              📅 {formatDate(data)} la ora <strong>{slotSel}</strong>
              <button className={s.backBtn} style={{ marginLeft: 12 }}
                onClick={() => { fetchSlots(data); setStep('slot') }}>
                Schimbă →
              </button>
            </div>

            <label className={s.formLabel}>Nume pacient *</label>
            <input className={s.input} value={nume} onChange={e => setNume(e.target.value)} />

            <label className={s.formLabel}>Telefon</label>
            <input className={s.input} type="tel" value={telefon} onChange={e => setTelefon(e.target.value)} />

            <label className={s.formLabel}>Motiv</label>
            <input className={s.input} value={motiv} onChange={e => setMotiv(e.target.value)} />

            <label className={s.formLabel}>Status</label>
            <select className={s.input} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="programat">Programat</option>
              <option value="confirmat">Confirmat</option>
              <option value="anulat">Anulat</option>
              <option value="finalizat">Finalizat</option>
            </select>

            <button className={s.loginBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Se salvează...' : '✓ Salvează modificările'}
            </button>
          </div>
        )}

        {step === 'slot' && (
          <div className={s.modalBody}>
            <div className={s.zileRapide}>
              {zileRapide.map(d => {
                const isSelected = toDateStr(d) === toDateStr(data)
                const isAzi = toDateStr(d) === toDateStr(azi)
                return (
                  <button key={toDateStr(d)}
                    className={`${s.ziRapida} ${isSelected ? s.ziRapidaActive : ''}`}
                    onClick={() => { setData(new Date(d)); fetchSlots(d) }}>
                    <div className={s.ziRapidaNume}>{ZILE[d.getDay()].slice(0,3)}</div>
                    <div className={s.ziRapidaData}>{d.getDate()} {LUNI[d.getMonth()]}</div>
                    {isAzi && <div className={s.ziRapidaAzi}>azi</div>}
                  </button>
                )
              })}
            </div>
            {loadingSlots ? (
              <div className={s.loading}>Se încarcă...</div>
            ) : (
              <div className={s.sloturiGrid}>
                {slots.map(slot => (
                  <button key={slot.ora}
                    className={`${s.slotBtn} ${slot.liber ? s.slotLiber : s.slotOcupat}`}
                    disabled={!slot.liber}
                    onClick={() => { setSlotSel(slot.ora); setStep('form') }}>
                    {slot.ora}
                    {!slot.liber && <div className={s.slotOcupatLabel}>ocupat</div>}
                  </button>
                ))}
              </div>
            )}
            <button className={s.backBtn} onClick={() => setStep('form')}>← Înapoi</button>
          </div>
        )}
      </div>
    </div>
  )
}