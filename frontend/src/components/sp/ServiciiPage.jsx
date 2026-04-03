const SERVICII = [
  { icon: '🩺', title: 'Consultații generale', desc: 'Evaluare clinică completă pentru adulți și copii, diagnostic și plan de tratament personalizat.' },
  { icon: '💉', title: 'Vaccinări', desc: 'Schema completă de vaccinare conform calendarului național, pentru copii și adulți.' },
  { icon: '🔬', title: 'Investigații', desc: 'Bilete de trimitere pentru analize, imagistică și consultații de specialitate.' },
  { icon: '📄', title: 'Rețete și certificate', desc: 'Rețete compensate, certificate medicale și concedii medicale eliberate la consultație.' },
  { icon: '❤️', title: 'Monitorizare boli cronice', desc: 'Urmărire periodică pentru hipertensiune, diabet, boli respiratorii și alte afecțiuni cronice.' },
  { icon: '🛡️', title: 'Medicină preventivă', desc: 'Controale periodice, screening și sfaturi pentru un stil de viață sănătos.' },
]

export default function ServiciiPage() {
  return (
    <section className="sp-section sp-servicii">
      <div className="sp-section-inner">
        <div className="sp-reveal">
          <span className="sp-section-tag">Ce oferim</span>
          <h2 className="sp-section-title">Servicii medicale complete</h2>
          <p className="sp-section-desc">Acoperim toate nevoile medicale de bază ale familiei tale, cu trimiteri rapide către specialiști când este necesar.</p>
        </div>
        <div className="sp-servicii-grid">
          {SERVICII.map((s, i) => (
            <div className="sp-serviciu-card sp-reveal" key={i}>
              <div className="sp-serviciu-icon">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}