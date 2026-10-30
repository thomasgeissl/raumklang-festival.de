import { useEffect } from 'react';
import { Box } from '@mui/material';
import Scene from './scene/Scene';
import Overlay from './components/Overlay';
import DragCue from './components/DragCue';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const lang = useAppStore((s) => s.lang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'background.default' }}>
      <Scene />
      <DragCue />
      <Overlay />
    </Box>
  );
}
