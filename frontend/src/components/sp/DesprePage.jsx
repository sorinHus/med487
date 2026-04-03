export default function DesprePage() {
  return (
    <section className="sp-section sp-despre">
      <div className="sp-section-inner">
        <div className="sp-despre-grid">
          <div className="sp-despre-img-wrap sp-reveal">
            <div className="sp-despre-img-placeholder">🏥</div>
            <div className="sp-despre-badge">
              <div className="sp-despre-badge-num">2010</div>
              <div className="sp-despre-badge-text">Fondată în</div>
            </div>
          </div>
          <div className="sp-reveal">
            <span className="sp-section-tag">Despre noi</span>
            <h2 className="sp-section-title">Un cabinet modern, cu valori tradiționale</h2>
            <p className="sp-section-desc">
              Medicina de familie înseamnă continuitate — cunoaștem istoricul fiecărui pacient și ne implicăm în sănătatea întregii familii, de la copii la vârstnici.
            </p>
            <div className="sp-despre-features">
              <div className="sp-feature-item">
                <div className="sp-feature-icon">🩺</div>
                <div className="sp-feature-text"><h4>Consultații complete</h4><p>Examinare clinică amănunțită, bilet de trimitere, rețete și concedii medicale</p></div>
              </div>
              <div className="sp-feature-item">
                <div className="sp-feature-icon">📋</div>
                <div className="sp-feature-text"><h4>Gestionare dosar medical</h4><p>Istoricul complet al consultațiilor și investigațiilor disponibil oricând</p></div>
              </div>
              <div className="sp-feature-item">
                <div className="sp-feature-icon">💬</div>
                <div className="sp-feature-text"><h4>Comunicare directă</h4><p>Răspunsuri rapide la întrebări, fără liste de așteptare interminabile</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}