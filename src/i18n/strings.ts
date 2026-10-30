import { useAppStore, type Lang } from '../store/useAppStore';

const strings = {
  de: {
    tagline: 'Ein partizipatives Spatial-Audio-Festival',
    comingSoon: 'Demnächst',
    presentedBy: 'präsentiert von',
    visitMucca: 'mucca.org besuchen',
    soundOn: 'Klang einschalten',
    soundOff: 'Klang ausschalten',
    dragMe: 'Zieh mich',
    audioError: 'Audio konnte nicht gestartet werden',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
  },
  en: {
    tagline: 'A participatory spatial audio festival',
    comingSoon: 'Coming soon',
    presentedBy: 'presented by',
    visitMucca: 'Visit mucca.org',
    soundOn: 'Turn sound on',
    soundOff: 'Turn sound off',
    dragMe: 'Drag me',
    audioError: 'Audio could not be started',
    imprint: 'Imprint',
    privacy: 'Privacy',
  },
} satisfies Record<Lang, Record<string, string>>;

export type StringKey = keyof (typeof strings)['de'];

export const useT = () => {
  const lang = useAppStore((s) => s.lang);
  return (key: StringKey) => strings[lang][key];
};
