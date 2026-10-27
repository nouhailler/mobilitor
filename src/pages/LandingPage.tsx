import { useEffect, useLayoutEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../i18n/useLocale';
import { getLanguage, setLanguage, type Language } from '../i18n';
import { landingContent } from '../landing/content';
import { InstallButton } from '../components/InstallButton';
import { Dialog } from '../components/Dialog';
import { LegalNotice } from '../components/LegalNotice';
import '../styles/landing.css';
function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      style={down ? { transform: 'rotate(90deg)' } : undefined}
    >
      <path d="M4 12h15m-6-6 6 6-6 6" />
    </svg>
  );
}
function Mark({ name }: { name: 'pin' | 'route' | 'compare' | 'check' }) {
  const paths = {
    pin: 'M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Z M15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    route: 'M5 5h9a4 4 0 0 1 0 8h-4a4 4 0 0 0 0 8h9M5 2v6M19 18v6',
    compare: 'M5 4v16m14-16v16M2 8h6m8 8h6M10 4l4 4-4 4',
    check: 'm5 12 4 4 10-10',
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function LandingPage({ language: forced }: { language?: Language }) {
  const selected = useLocale();
  const language = forced || selected;
  const c = landingContent[language];
  const [legal, setLegal] = useState(false);
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.theme;
    const scheme = root.style.colorScheme;
    root.dataset.theme = 'light';
    root.style.colorScheme = 'light';
    return () => {
      if (previous) root.dataset.theme = previous;
      else delete root.dataset.theme;
      root.style.colorScheme = scheme;
    };
  }, []);
  useLayoutEffect(() => {
    if (forced && getLanguage() !== forced) void setLanguage(forced);
  }, [forced]);
  useEffect(() => {
    document.title =
      language === 'fr'
        ? 'Mobilitor — Vos prochains trajets, vos propres horizons'
        : 'Mobilitor — Your next journeys, your own horizons';
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute('content', c.intro);
    return () => {
      const lang = getLanguage();
      document.title =
        lang === 'en'
          ? 'Mobilitor — Local mobility & isochrones'
          : 'Mobilitor — Mobilité & isochrones locales';
      description?.setAttribute(
        'content',
        lang === 'en'
          ? 'Explore France and calculate public transport journeys locally on your device.'
          : 'Explorez la France et calculez vos déplacements en transports localement sur votre appareil.',
      );
    };
  }, [language, c.intro]);
  function scroll(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  }
  return (
    <div className="landing">
      <a
        className="lp-skip"
        href="#landing-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('landing-content')?.focus();
        }}
      >
        {c.skip}
      </a>
      <header className="lp-header lp-container">
        <Link to={`/presentation/${language}`} className="lp-brand" aria-label="Mobilitor">
          <span className="lp-brand-mark">m</span>
          <span>
            Mobilitor<small>{c.tagline}</small>
          </span>
        </Link>
        <nav aria-label={language === 'fr' ? 'Navigation de présentation' : 'Overview navigation'}>
          {c.nav.map((name, i) => (
            <button
              key={i}
              onClick={() => scroll(['landing-features', 'landing-how', 'landing-faq'][i])}
            >
              {name}
            </button>
          ))}
        </nav>
        <div className="lp-header-actions">
          <div className="lp-languages" aria-label="Langue / Language">
            <Link
              to="/presentation/fr"
              lang="fr"
              aria-current={language === 'fr' ? 'page' : undefined}
            >
              FR
            </Link>
            <span>/</span>
            <Link
              to="/presentation/en"
              lang="en"
              aria-current={language === 'en' ? 'page' : undefined}
            >
              EN
            </Link>
          </div>
          <Link className="lp-button lp-small" to="/">
            {c.open}
            <Arrow />
          </Link>
        </div>
      </header>
      <main id="landing-content" tabIndex={-1}>
        <section className="lp-hero lp-container">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow">
              <span />
              {c.eyebrow}
            </p>
            <h1>
              {c.title.split('\n').map((line, i) => (
                <span key={line} className={i ? 'lp-title-accent' : ''}>
                  {line}
                </span>
              ))}
            </h1>
            <p className="lp-intro">{c.intro}</p>
            <div className="lp-hero-actions">
              <Link className="lp-button" to="/">
                {c.heroAction}
                <Arrow />
              </Link>
              <button className="lp-text-link" onClick={() => scroll('landing-how')}>
                {c.howAction}
                <Arrow down />
              </button>
            </div>
            <ul className="lp-trust">
              {c.trust.map((item) => (
                <li key={item}>
                  <span>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <figure className="lp-preview">
            <div className="lp-browserbar">
              <div>
                <i />
                <i />
                <i />
              </div>
              <span>Mobilitor / {language === 'fr' ? 'Explorer' : 'Explore'}</span>
              <span aria-hidden="true">↗</span>
            </div>
            <div className="lp-screenshot">
              <img
                src={`${import.meta.env.BASE_URL}landing/app-${language}.jpg`}
                alt={c.previewAlt}
                width="1600"
                height="1060"
                fetchPriority="high"
              />
            </div>
            <figcaption>
              <span className="lp-live-dot" />
              {c.previewCaption}{' '}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                © OpenStreetMap contributors
              </a>
            </figcaption>
            <div className="lp-preview-note" aria-hidden="true">
              <span>15</span>
              <span>30</span>
              <span>45</span>
              <span>
                60<small> min</small>
              </span>
            </div>
          </figure>
        </section>
        <div className="lp-strip">
          <div className="lp-container">
            <span>{c.strip[0]}</span>
            <span aria-hidden="true">✳</span>
            <strong>{c.strip[1]}</strong>
          </div>
        </div>
        <section id="landing-features" className="lp-features lp-container">
          <div className="lp-section-heading">
            <div>
              <p className="lp-eyebrow">{c.featuresEyebrow}</p>
              <h2>{c.featuresTitle}</h2>
            </div>
            <p>{c.featuresIntro}</p>
          </div>
          <div className="lp-feature-grid">
            <article className="lp-reach-card">
              <div className="lp-feature-icon">
                <Mark name="pin" />
              </div>
              <h3>{c.features[0].title}</h3>
              <p>{c.features[0].text}</p>
              <div
                className="lp-time-bars"
                aria-label={
                  language === 'fr' ? 'Seuils temporels disponibles' : 'Available time limits'
                }
              >
                {[15, 30, 45, 60].map((n) => (
                  <div key={n} style={{ width: `${35 + n * 0.9}%` }}>
                    <span>{n}</span>
                    <small> min</small>
                    <i />
                  </div>
                ))}
              </div>
              <small className="lp-feature-caption">{c.features[0].caption}</small>
            </article>
            <div className="lp-feature-stack">
              {c.features.slice(1).map((feature, i) => (
                <article key={feature.title}>
                  <div className="lp-feature-icon">
                    <Mark name={i ? 'compare' : 'route'} />
                  </div>
                  <div>
                    <span className="lp-feature-number">0{i + 2}</span>
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <ul className="lp-tools">
            {c.tools.map((tool) => (
              <li key={tool}>
                <Mark name="check" />
                {tool}
              </li>
            ))}
          </ul>
        </section>
        <section id="landing-how" className="lp-how">
          <div className="lp-container lp-how-grid">
            <div>
              <p className="lp-eyebrow">{c.stepsEyebrow}</p>
              <h2>{c.stepsTitle}</h2>
              <p className="lp-how-intro">{c.stepsIntro}</p>
              <Link className="lp-text-link" to="/donnees">
                {language === 'fr' ? 'Ouvrir la gestion des données' : 'Open data management'}
                <Arrow />
              </Link>
            </div>
            <ol>
              {c.steps.map((step, i) => (
                <li key={step.title}>
                  <span className="lp-step">0{i + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className="lp-privacy">
          <div className="lp-container lp-privacy-grid">
            <div>
              <p className="lp-eyebrow">{c.privacyEyebrow}</p>
              <h2>{c.privacyTitle}</h2>
              <p>{c.privacyText}</p>
            </div>
            <div>
              <ul>
                {c.privacyItems.map((item) => (
                  <li key={item}>
                    <Mark name="check" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="lp-privacy-note">{c.privacyNote}</p>
            </div>
          </div>
        </section>
        <section id="landing-faq" className="lp-faq lp-container">
          <div>
            <p className="lp-eyebrow">{c.faqEyebrow}</p>
            <h2>{c.faqTitle}</h2>
          </div>
          <div>
            {c.faqs.map((faq, i) => (
              <details key={i}>
                <summary>
                  {faq.q}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="lp-final lp-container">
          <p className="lp-eyebrow">{c.finalEyebrow}</p>
          <h2>{c.finalTitle}</h2>
          <p>{c.finalText}</p>
          <div>
            <Link className="lp-button" to="/">
              {c.open}
              <Arrow />
            </Link>
            <InstallButton />
          </div>
        </section>
      </main>
      <footer className="lp-footer lp-container">
        <div>
          <Link className="lp-footer-brand" to={`/presentation/${language}`}>
            Mobilitor<span>↗</span>
          </Link>
          <p>
            {c.footer}
            <br />
            {c.footerNote}
          </p>
        </div>
        <div>
          <button onClick={() => setLegal(true)}>{c.legal}</button>
          <a href="https://github.com/nouhailler/mobilitor" target="_blank" rel="noreferrer">
            {c.code}
            <Arrow />
          </a>
          <span>© 2026 Mobilitor</span>
        </div>
      </footer>
      {legal && (
        <Dialog title={c.legalTitle} onClose={() => setLegal(false)}>
          <LegalNotice />
        </Dialog>
      )}
    </div>
  );
}
