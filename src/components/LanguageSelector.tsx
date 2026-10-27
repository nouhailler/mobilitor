import { setLanguage, t } from '../i18n';
import { useLocale } from '../i18n/useLocale';
export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const language = useLocale();
  const select = (
    <select
      aria-label={compact ? 'Langue / Language' : t('Langue de l’interface')}
      value={language}
      onChange={(event) => void setLanguage(event.target.value === 'en' ? 'en' : 'fr')}
    >
      <option value="fr" lang="fr">
        Français
      </option>
      <option value="en" lang="en">
        English
      </option>
    </select>
  );
  return compact ? (
    <div className="language-selector compact">{select}</div>
  ) : (
    <label className="language-selector">
      {t('Langue de l’interface')}
      {select}
    </label>
  );
}
