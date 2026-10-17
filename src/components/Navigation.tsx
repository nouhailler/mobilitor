import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Dialog } from './Dialog';
import { InstallButton } from './InstallButton';
const groups = [
  {
    title: 'Se déplacer',
    items: [
      ['/', '🗺', 'Explorer', 'Carte, isochrones et itinéraires'],
      ['/comparaison', '⚖', 'Comparer', 'Deux ou trois points de départ'],
    ],
  },
  {
    title: 'Données et bibliothèque',
    items: [
      ['/donnees', '↧', 'Mes données', 'Importer, remplacer et supprimer'],
      ['/sources', '▤', 'Sources', 'Provenance, licences et validité'],
    ],
  },
  {
    title: 'Application',
    items: [
      ['/parametres', '⚙', 'Paramètres', 'Thème, favoris et stockage'],
      ['/systeme', '↻', 'Système', 'Version, installation et mises à jour'],
      ['/a-propos', 'ⓘ', 'À propos & mentions légales', 'Confidentialité et responsabilité'],
    ],
  },
];
export function Navigation() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="hamburger"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Afficher les fonctionnalités par catégorie"
        onClick={() => setOpen(true)}
      >
        ☰ <span>Menu</span>
      </button>
      {open && (
        <Dialog title="Toutes les fonctionnalités" onClose={() => setOpen(false)}>
          <nav className="category-nav" aria-label="Navigation principale">
            {groups.map((group) => (
              <section key={group.title}>
                <h3>{group.title}</h3>
                {group.items.map(([path, icon, name, description]) => (
                  <NavLink
                    aria-label={name}
                    key={path}
                    to={path}
                    end={path === '/'}
                    onClick={() => setOpen(false)}
                  >
                    <span aria-hidden>{icon}</span>
                    <span>
                      {name}
                      <small>{description}</small>
                    </span>
                  </NavLink>
                ))}
              </section>
            ))}
          </nav>
          <InstallButton />
        </Dialog>
      )}
    </>
  );
}
