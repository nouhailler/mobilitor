import { t } from '../i18n';
import { useLocale } from '../i18n/useLocale';
import { useId, useState, useRef, useLayoutEffect, type CSSProperties } from 'react';
export function HelpTip({ text }: { text: string }) {
  const language = useLocale();

  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<CSSProperties>({});
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false),
    [dismissed, setDismissed] = useState(false);
  const shown = open || (hover && !dismissed);
  useLayoutEffect(() => {
    if (!shown) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setOpen(false);
        setHover(false);
        setDismissed(true);
        return;
      }
      const width = Math.min(265, window.innerWidth * 0.7);
      setPosition({
        position: 'fixed',
        left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
        right: 'auto',
        ...(rect.top > 220
          ? { bottom: window.innerHeight - rect.top + 8, top: 'auto' }
          : { top: rect.bottom + 8, bottom: 'auto' }),
      });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [shown, language]);
  return (
    <span
      className="help-tip"
      onMouseEnter={() => {
        setHover(true);
        setDismissed(false);
      }}
      onMouseLeave={() => setHover(false)}
    >
      <button
        ref={trigger}
        type="button"
        className="tip-trigger"
        aria-label={t('Afficher une explication')}
        aria-describedby={shown ? id : undefined}
        aria-expanded={shown}
        onClick={(e) => {
          e.preventDefault();
          setOpen(!open);
          setDismissed(true);
        }}
        onBlur={() => {
          setOpen(false);
          setDismissed(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            setDismissed(true);
          }
        }}
      >
        ⓘ
      </button>
      <span
        style={position}
        id={id}
        role="tooltip"
        className={shown ? 'tip-content is-open' : 'tip-content'}
      >
        {t(text)}
      </span>
    </span>
  );
}
