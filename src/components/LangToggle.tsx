import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useAppStore, type Lang } from '../store/useAppStore';

export default function LangToggle() {
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);

  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={lang}
      onChange={(_, v: Lang | null) => v && setLang(v)}
      aria-label="Sprache / Language"
      sx={{
        backdropFilter: 'blur(8px)',
        bgcolor: 'rgba(26, 18, 13, 0.5)',
        '& .MuiToggleButton-root': { px: 1.5, fontWeight: 600, borderRadius: 999 },
      }}
    >
      <ToggleButton value="de" lang="de">DE</ToggleButton>
      <ToggleButton value="en" lang="en">EN</ToggleButton>
    </ToggleButtonGroup>
  );
}
