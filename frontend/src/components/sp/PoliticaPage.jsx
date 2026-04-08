import s from '../../styles/sp.module.css'

export default function PoliticaPage() {
  return (
    <div className={s.politicaWrap}>
      <div className={s.politicaContent}>
        <h1 className={s.politicaTitle}>Politică de Confidențialitate</h1>
        <p className={s.politicaMeta}>Ultima actualizare: aprilie 2026</p>

        <h2>1. Cine suntem</h2>
        <p>
          Cabinetul Medical Dr. Ion Popescu, cu sediul în Cluj-Napoca, este operatorul datelor
          cu caracter personal colectate prin intermediul acestui site și al aplicației MED487.
          Ne puteți contacta la adresa de email indicată în secțiunea Program &amp; Contact.
        </p>

        <h2>2. Ce date colectăm</h2>
        <p>Colectăm următoarele categorii de date cu caracter personal:</p>
        <ul>
          <li>Date de identificare: nume, prenume, CNP, dată naștere</li>
          <li>Date de contact: adresă, telefon, email</li>
          <li>Date medicale: consultatii, diagnostice, rețete, trimiteri, concedii medicale</li>
          <li>Date tehnice: adresa IP, tipul browserului, jurnale de activitate</li>
        </ul>

        <h2>3. De ce colectăm datele</h2>
        <p>Datele sunt prelucrate în următoarele scopuri:</p>
        <ul>
          <li>Furnizarea serviciilor medicale și gestionarea programărilor</li>
          <li>Respectarea obligațiilor legale (raportare CNAS, arhivare dosare medicale)</li>
          <li>Comunicarea cu pacienții privind programările și tratamentele</li>
          <li>Securitatea și funcționarea aplicației</li>
        </ul>

        <h2>4. Temeiul legal</h2>
        <p>
          Prelucrarea datelor medicale se realizează în baza Art. 9 alin. (2) lit. (h) din
          Regulamentul (UE) 2016/679 (GDPR) — prestarea de servicii medicale — și a legislației
          naționale aplicabile (Legea nr. 46/2003 privind drepturile pacientului).
        </p>

        <h2>5. Cât timp păstrăm datele</h2>
        <p>
          Dosarele medicale se păstrează minimum 10 ani conform legislației în vigoare.
          Datele de contact și jurnalele tehnice se păstrează maximum 3 ani de la ultima
          interacțiune, după care sunt șterse sau anonimizate.
        </p>

        <h2>6. Cu cine împărtășim datele</h2>
        <p>
          Nu vindem și nu transferăm datele dumneavoastră către terți în scop comercial.
          Datele pot fi transmise către:
        </p>
        <ul>
          <li>Casa Națională de Asigurări de Sănătate (CNAS) — obligație legală de raportare</li>
          <li>Furnizori de servicii tehnice (hosting, stocare cloud) — exclusiv pentru operarea aplicației, în baza unor contracte de prelucrare a datelor</li>
        </ul>

        <h2>7. Drepturile dumneavoastră</h2>
        <p>Conform GDPR, aveți următoarele drepturi:</p>
        <ul>
          <li><strong>Dreptul de acces</strong> — puteți solicita o copie a datelor deținute despre dumneavoastră</li>
          <li><strong>Dreptul la rectificare</strong> — puteți solicita corectarea datelor inexacte</li>
          <li><strong>Dreptul la ștergere</strong> — puteți solicita ștergerea datelor, în limitele obligațiilor legale</li>
          <li><strong>Dreptul la portabilitate</strong> — puteți solicita datele într-un format structurat</li>
          <li><strong>Dreptul de opoziție</strong> — puteți obiecta față de anumite tipuri de prelucrare</li>
        </ul>
        <p>
          Pentru exercitarea acestor drepturi, ne puteți contacta prin datele din secțiunea
          Program &amp; Contact. Aveți de asemenea dreptul de a depune o plângere la
          Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal
          (ANSPDCP — <a href="https://www.dataprotection.ro" target="_blank" rel="noreferrer">www.dataprotection.ro</a>).
        </p>

        <h2>8. Cookie-uri</h2>
        <p>
          Acest site folosește cookie-uri strict necesare pentru funcționarea autentificării
          și a sesiunii de utilizator (token JWT stocat în localStorage). Nu folosim cookie-uri
          de tracking sau publicitate. Prin continuarea navigării, acceptați utilizarea acestor
          cookie-uri tehnice.
        </p>

        <h2>9. Securitatea datelor</h2>
        <p>
          Datele sunt transmise exclusiv prin conexiuni criptate (HTTPS). Accesul la aplicație
          este protejat prin autentificare JWT cu expirare automată. Jurnalele de activitate
          înregistrează toate acțiunile asupra datelor medicale.
        </p>

        <h2>10. Modificări ale politicii</h2>
        <p>
          Rezervăm dreptul de a actualiza această politică. Versiunea actualizată va fi
          publicată pe această pagină cu data ultimei modificări.
        </p>
      </div>
    </div>
  )
}