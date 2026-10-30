import { Box, Button, Chip, Link, Stack, Typography } from '@mui/material';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import AudioToggle from './AudioToggle';
import LangToggle from './LangToggle';
import { useT } from '../i18n/strings';
import { IMPRINT_URL, MUCCA_URL, PRIVACY_URL } from '../config';

/** HTML layer above the canvas. Only interactive elements receive pointer events, so the sphere stays draggable. */
export default function Overlay() {
  const t = useT();

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: { xs: 2, sm: 4 },
        '& a, & button': { pointerEvents: 'auto' },
      }}
    >
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="overline" sx={{ letterSpacing: '0.3em', color: 'text.secondary' }}>
          raumklang-festival.de
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <LangToggle />
          <AudioToggle />
        </Stack>
      </Stack>

      <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
        <Chip
          label={t('comingSoon')}
          color="primary"
          variant="outlined"
          sx={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}
        />
        <Typography
          variant="h1"
          sx={{
            fontSize: 'clamp(2.4rem, 11vw, 7.5rem)',
            textShadow: '0 0 40px rgba(255, 138, 61, 0.35)',
            mr: '-0.18em', // compensate trailing letter-spacing for optical centering
          }}
        >
          RAUMKLANG
        </Typography>
        <Typography variant="h2" sx={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)', color: 'text.secondary' }}>
          {t('tagline')}
        </Typography>
      </Stack>

      <Stack spacing={2} sx={{ alignItems: 'center' }}>
        <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('presentedBy')}
          </Typography>
          <Button
            variant="contained"
            href={MUCCA_URL}
            target="_blank"
            rel="noopener"
            endIcon={<ArrowOutwardRoundedIcon />}
          >
            {t('visitMucca')}
          </Button>
        </Stack>
        <Stack direction="row" spacing={2}>
          <Link href={IMPRINT_URL} target="_blank" rel="noopener" variant="caption" color="text.secondary">
            {t('imprint')}
          </Link>
          <Link href={PRIVACY_URL} target="_blank" rel="noopener" variant="caption" color="text.secondary">
            {t('privacy')}
          </Link>
        </Stack>
      </Stack>
    </Box>
  );
}
