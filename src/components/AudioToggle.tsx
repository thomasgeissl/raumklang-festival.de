import { CircularProgress, IconButton, Tooltip } from '@mui/material';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { useAppStore } from '../store/useAppStore';
import { useT } from '../i18n/strings';

// Audio engine (incl. Elementary's WASM) is loaded on first click to keep the initial bundle small.
const loadEngine = () => import('../audio/engine');

export default function AudioToggle() {
  const audioState = useAppStore((s) => s.audioState);
  const t = useT();
  const on = audioState === 'on';
  const label = audioState === 'error' ? t('audioError') : on ? t('soundOff') : t('soundOn');

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        aria-pressed={on}
        disabled={audioState === 'starting'}
        onClick={async () => {
          const engine = await loadEngine();
          if (on) engine.stopAudio();
          else await engine.startAudio();
        }}
        sx={{
          border: 1,
          borderColor: on ? 'primary.main' : 'divider',
          color: on ? 'primary.main' : 'text.primary',
          backdropFilter: 'blur(8px)',
          bgcolor: 'rgba(26, 18, 13, 0.5)',
        }}
      >
        {audioState === 'starting' ? (
          <CircularProgress size={24} color="inherit" />
        ) : audioState === 'error' ? (
          <ErrorOutlineRoundedIcon />
        ) : on ? (
          <VolumeUpRoundedIcon />
        ) : (
          <VolumeOffRoundedIcon />
        )}
      </IconButton>
    </Tooltip>
  );
}
