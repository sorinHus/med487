import s from '../../styles/sp.module.css'

export default function DesprePage() {
  return (
    <section className={`${s.section} ${s.despre}`}>
      <div className={s.sectionInner}>
        <div className={s.despreGrid}>
          <div className={`${s.despreImgWrap} ${s.reveal}`}>
            <div className={s.despreImgPlaceholder}>🏥</div>
            <div className={s.despreBadge}>
              <div className={s.despreBadgeNum}>2010</div>
              <div className={s.despreBadgeText}>Fondată în</div>
            </div>
          </div>
          <div className={s.reveal}>
            <span className={s.sectionTag}>Despre noi</span>
            <h2 className={s.sectionTitle}>Un cabinet modern, cu valori tradiționale</h2>
            <p className={s.sectionDesc}>
              Medicina de familie înseamnă continuitate — cunoaștem istoricul fiecărui pacient și ne implicăm în sănătatea întregii familii, de la copii la vârstnici.
            </p>
            <div className={s.despreFeatures}>
              <div className={s.featureItem}>
                <div className={s.featureIcon}>🩺</div>
                <div className={s.featureText}><h4>Consultații complete</h4><p>Examinare clinică amănunțită, bilet de trimitere, rețete și concedii medicale</p></div>
              </div>
              <div className={s.featureItem}>
                <div className={s.featureIcon}>📋</div>
                <div className={s.featureText}><h4>Gestionare dosar medical</h4><p>Istoricul complet al consultațiilor și investigațiilor disponibil oricând</p></div>
              </div>
              <div className={s.featureItem}>
                <div className={s.featureIcon}>💬</div>
                <div className={s.featureText}><h4>Comunicare directă</h4><p>Răspunsuri rapide la întrebări, fără liste de așteptare interminabile</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}