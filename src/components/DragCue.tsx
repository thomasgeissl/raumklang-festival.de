import { useEffect, useRef } from 'react';
import { Chip } from '@mui/material';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
import { cue } from '../scene/emitterState';
import { useT } from '../i18n/strings';

/** "Drag me" label that follows one sound source until the visitor first grabs one. */
export default function DragCue() {
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        el.style.transform = `translate(${cue.x}px, ${cue.y}px) translate(-50%, -150%)`;
        el.style.opacity = cue.visible ? '1' : '0';
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      style={{ position: 'absolute', left: 0, top: 0, opacity: 0, transition: 'opacity 0.6s', pointerEvents: 'none' }}
    >
      <Chip
        size="small"
        icon={<PanToolRoundedIcon />}
        label={t('dragMe')}
        color="primary"
        variant="outlined"
        sx={{ bgcolor: 'rgba(12, 8, 6, 0.6)', backdropFilter: 'blur(6px)', fontWeight: 600 }}
      />
    </div>
  );
}
