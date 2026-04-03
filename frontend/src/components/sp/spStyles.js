export const spStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');

  .sp-root {
    font-family: 'DM Sans', sans-serif;
    background: #faf8f4;
    color: #1a2332;
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* NAV */
  .sp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: rgba(250,248,244,0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid #e2e8f0;
    padding: 0 3rem;
    height: 68px;
    display: flex; align-items: center; justify-content: space-between;
    transition: box-shadow .3s;
  }
  .sp-nav.scrolled { box-shadow: 0 8px 32px rgba(26,53,87,0.12); }
  .sp-nav-logo { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; }
  .sp-nav-logo-icon {
    width: 38px; height: 38px; background: #1a3557; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; color: white; font-size: 1.1rem;
  }
  .sp-nav-logo-text { display: flex; flex-direction: column; line-height: 1.2; }
  .sp-nav-logo-name { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 600; color: #1a3557; }
  .sp-nav-logo-sub { font-size: 0.7rem; color: #718096; letter-spacing: .04em; }
  .sp-nav-links { display: flex; align-items: center; gap: 2rem; list-style: none; margin: 0; padding: 0; }
  .sp-nav-links a { text-decoration: none; color: #4a5568; font-size: 0.88rem; font-weight: 500; transition: color .2s; }
  .sp-nav-links a:hover, .sp-nav-links a.active { color: #2563a8; }
  .sp-btn-nav {
    background: #1a3557; color: white !important; padding: 0.5rem 1.25rem;
    border-radius: 8px; font-size: 0.85rem !important; font-weight: 500 !important;
    transition: background .2s, transform .15s !important;
  }
  .sp-btn-nav:hover { background: #2563a8 !important; transform: translateY(-1px); }
  .sp-btn-nav-outline {
    background: transparent; color: #1a3557 !important; padding: 0.5rem 1.25rem;
    border-radius: 8px; font-size: 0.85rem !important; font-weight: 500 !important;
    border: 1.5px solid #1a3557;
    transition: background .2s, color .2s !important;
  }
  .sp-btn-nav-outline:hover { background: #1a3557 !important; color: white !important; }

  /* PAGE WRAPPER */
  .sp-page { padding-top: 68px; min-height: 100vh; }

  /* HERO */
  .sp-hero {
    min-height: calc(100vh - 68px); display: flex; align-items: center;
    padding: 4rem 3rem; position: relative; overflow: hidden;
    background: linear-gradient(135deg, #faf8f4 55%, #f0f6ff 100%);
  }
  .sp-hero::before {
    content: ''; position: absolute; top: -80px; right: -80px;
    width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(37,99,168,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .sp-hero-inner {
    max-width: 1100px; margin: 0 auto; width: 100%;
    display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center;
  }
  .sp-hero-badge {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: #f5e9cc; color: #b8892a;
    padding: 0.35rem 0.9rem; border-radius: 999px;
    font-size: 0.78rem; font-weight: 500; letter-spacing: .04em;
    margin-bottom: 1.5rem;
    animation: spFadeUp .6s ease both;
  }
  .sp-hero h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2.2rem, 4vw, 3.2rem); font-weight: 600; line-height: 1.2;
    color: #1a3557; margin-bottom: 1.25rem;
    animation: spFadeUp .6s .1s ease both;
  }
  .sp-hero h1 em { font-style: italic; color: #2563a8; }
  .sp-hero-desc {
    font-size: 1.05rem; color: #4a5568; font-weight: 300; line-height: 1.75;
    margin-bottom: 2.25rem; animation: spFadeUp .6s .2s ease both;
  }
  .sp-hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; animation: spFadeUp .6s .3s ease both; }
  .sp-btn-primary {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: #1a3557; color: white; padding: 0.85rem 1.75rem; border-radius: 10px;
    text-decoration: none; font-weight: 500; font-size: 0.95rem;
    box-shadow: 0 8px 32px rgba(26,53,87,0.12);
    transition: background .2s, transform .15s, box-shadow .2s;
  }
  .sp-btn-primary:hover { background: #2563a8; transform: translateY(-2px); box-shadow: 0 20px 60px rgba(26,53,87,0.16); }
  .sp-btn-secondary {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: white; color: #1a3557; padding: 0.85rem 1.75rem; border-radius: 10px;
    text-decoration: none; font-weight: 500; font-size: 0.95rem;
    border: 1.5px solid #e2e8f0; transition: border-color .2s, transform .15s;
  }
  .sp-btn-secondary:hover { border-color: #2563a8; transform: translateY(-2px); }
  .sp-hero-card {
    background: white; border-radius: 20px; padding: 2rem;
    box-shadow: 0 20px 60px rgba(26,53,87,0.16);
    animation: spFadeLeft .7s .2s ease both; position: relative;
  }
  .sp-hero-card::before {
    content: ''; position: absolute; top: -3px; left: 20px; right: 20px; height: 3px;
    background: linear-gradient(90deg, #1a3557, #2563a8); border-radius: 2px 2px 0 0;
  }
  .sp-card-header {
    display: flex; align-items: center; gap: 1rem;
    padding-bottom: 1.25rem; border-bottom: 1px solid #e2e8f0; margin-bottom: 1.25rem;
  }
  .sp-doctor-avatar {
    width: 58px; height: 58px; border-radius: 50%;
    background: linear-gradient(135deg, #1a3557, #2563a8);
    display: flex; align-items: center; justify-content: center;
    color: white; font-family: 'Playfair Display', serif;
    font-size: 1.4rem; font-weight: 600; flex-shrink: 0;
  }
  .sp-card-header-info h3 { font-family: 'Playfair Display', serif; font-size: 1.05rem; color: #1a3557; }
  .sp-card-header-info p { font-size: 0.8rem; color: #718096; margin-top: 2px; }
  .sp-card-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.25rem; }
  .sp-stat-item { text-align: center; padding: 0.75rem 0.5rem; background: #f0f6ff; border-radius: 10px; }
  .sp-stat-num { font-size: 1.4rem; font-weight: 600; color: #1a3557; font-family: 'Playfair Display', serif; }
  .sp-stat-label { font-size: 0.7rem; color: #718096; margin-top: 2px; }

  /* SECTIONS */
  .sp-section { padding: 5rem 3rem; }
  .sp-section-inner { max-width: 1100px; margin: 0 auto; }
  .sp-section-tag {
    display: inline-block; font-size: 0.75rem; font-weight: 500;
    letter-spacing: .1em; text-transform: uppercase; color: #2563a8; margin-bottom: 0.75rem;
  }
  .sp-section-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.7rem, 3vw, 2.4rem); color: #1a3557; line-height: 1.25; margin-bottom: 1rem;
  }
  .sp-section-desc { font-size: 1rem; color: #4a5568; font-weight: 300; max-width: 560px; line-height: 1.8; }

  /* DESPRE */
  .sp-despre { background: white; }
  .sp-despre-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center; }
  .sp-despre-img-wrap { position: relative; }
  .sp-despre-img-placeholder {
    background: linear-gradient(135deg, #f0f6ff 0%, #dbeafe 100%);
    border-radius: 20px; height: 380px;
    display: flex; align-items: center; justify-content: center;
    font-size: 5rem; box-shadow: 0 8px 32px rgba(26,53,87,0.12);
  }
  .sp-despre-badge {
    position: absolute; bottom: -16px; right: -16px;
    background: #b8892a; color: white; padding: 1rem 1.25rem;
    border-radius: 14px; box-shadow: 0 8px 32px rgba(26,53,87,0.12); text-align: center;
  }
  .sp-despre-badge-num { font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 600; line-height: 1; }
  .sp-despre-badge-text { font-size: 0.72rem; opacity: .9; margin-top: 3px; }
  .sp-despre-features { margin-top: 2rem; display: flex; flex-direction: column; gap: 1rem; }
  .sp-feature-item {
    display: flex; gap: 0.9rem; align-items: flex-start;
    padding: 0.9rem 1rem; border-radius: 10px; background: #f0f6ff; transition: transform .2s;
  }
  .sp-feature-item:hover { transform: translateX(4px); }
  .sp-feature-icon {
    width: 36px; height: 36px; flex-shrink: 0; background: #1a3557;
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    color: white; font-size: 1rem;
  }
  .sp-feature-text h4 { font-size: 0.9rem; font-weight: 500; color: #1a3557; }
  .sp-feature-text p { font-size: 0.8rem; color: #718096; margin-top: 2px; }

  /* SERVICII */
  .sp-servicii { background: #faf8f4; }
  .sp-servicii-grid { margin-top: 3rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
  .sp-serviciu-card {
    background: white; border-radius: 16px; padding: 1.75rem 1.5rem;
    border: 1px solid #e2e8f0; transition: transform .2s, box-shadow .2s, border-color .2s;
  }
  .sp-serviciu-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(26,53,87,0.12); border-color: #dbeafe; }
  .sp-serviciu-icon {
    font-size: 1.75rem; width: 52px; height: 52px; background: #f0f6ff;
    border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;
  }
  .sp-serviciu-card h3 { font-size: 1rem; font-weight: 500; color: #1a3557; margin-bottom: 0.5rem; }
  .sp-serviciu-card p { font-size: 0.82rem; color: #718096; line-height: 1.65; }

  /* PROGRAM */
  .sp-program-page { background: #1a3557; color: white; }
  .sp-program-page .sp-section-tag { color: #b8892a; }
  .sp-program-page .sp-section-title { color: white; }
  .sp-program-page .sp-section-desc { color: rgba(255,255,255,0.65); }
  .sp-program-grid { margin-top: 3rem; display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; }
  .sp-program-table { width: 100%; border-collapse: collapse; }
  .sp-program-table tr { border-bottom: 1px solid rgba(255,255,255,0.08); }
  .sp-program-table tr:last-child { border-bottom: none; }
  .sp-program-table td { padding: 0.9rem 0; font-size: 0.9rem; }
  .sp-program-table td:first-child { color: rgba(255,255,255,0.7); }
  .sp-program-table td:last-child { color: white; font-weight: 500; text-align: right; }
  .sp-program-table .sp-closed { color: rgba(255,255,255,0.3); font-style: italic; }

  
  /* INFO BOX (folosit in Program si Contact) */
  .sp-info-box {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px; padding: 2rem;
  }
  .sp-info-row { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1.5rem; }
  .sp-info-row:last-child { margin-bottom: 0; }
  .sp-info-icon {
    width: 40px; height: 40px; flex-shrink: 0; background: rgba(255,255,255,0.1);
    border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
  }
  .sp-info-text h4 { font-size: 0.85rem; font-weight: 500; color: white; margin-bottom: 3px; }
  .sp-info-text p { font-size: 0.8rem; color: rgba(255,255,255,0.55); line-height: 1.5; }

  /* FOOTER */
  .sp-footer {
    background: #1a3557; color: white; padding: 2rem 3rem;
    display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  .sp-footer-logo { font-family: 'Playfair Display', serif; font-size: 1rem; color: white; font-weight: 600; }
  .sp-footer-logo span {
    color: rgba(255,255,255,0.45); font-size: 0.75rem; display: block; margin-top: 2px;
    font-family: 'DM Sans', sans-serif; font-weight: 300;
  }
  .sp-footer p { font-size: 0.78rem; color: rgba(255,255,255,0.4); }

  /* ANIMATIONS */
  @keyframes spFadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spFadeLeft {
    from { opacity: 0; transform: translateX(32px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .sp-reveal { opacity: 0; transform: translateY(20px); transition: opacity .6s ease, transform .6s ease; }
  .sp-reveal.sp-visible { opacity: 1; transform: translateY(0); }

  .sp-dropdown-wrap:hover .sp-dropdown-menu { display: flex; }
  .sp-dropdown-menu {
    display: none; flex-direction: column;
    position: absolute; top: 100%; right: 0;
    padding-top: 8px;
    background: transparent;
    z-index: 200; min-width: 170px;
  }
  .sp-dropdown-menu-inner {
    background: white; border: 1px solid #e2e8f0; border-radius: 10px;
    box-shadow: 0 8px 32px rgba(26,53,87,0.12);
    overflow: hidden;
  }
  .sp-dropdown-menu a {
    padding: 0.75rem 1rem; font-size: 0.85rem !important;
    color: #1a2332 !important; text-decoration: none;
    transition: background .15s; display: block;
  }
  .sp-dropdown-menu a:hover { background: #f0f6ff; color: #2563a8 !important; }
  .sp-dropdown-menu a {
    padding: 0.75rem 1rem; font-size: 0.85rem !important;
    color: #1a2332 !important; text-decoration: none;
    transition: background .15s; display: block;
  }
  .sp-dropdown-menu a:hover { background: #f0f6ff; color: #2563a8 !important; }
`