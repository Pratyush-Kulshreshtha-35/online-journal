export interface CuratedGif {
  id: string;
  label: string;
  category: string;
  url: string;
}

export const CURATED_GIFS: CuratedGif[] = [
  {
    id: 'calm-rain',
    label: 'Gentle Rain Window',
    category: 'Calm',
    url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'cozy-coffee',
    label: 'Cozy Morning Coffee',
    category: 'Cozy',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'starry-night',
    label: 'Silent Starry Night',
    category: 'Night',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'ocean-waves',
    label: 'Meditative Ocean Tide',
    category: 'Nature',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'forest-path',
    label: 'Green Forest Walkway',
    category: 'Nature',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'warm-fireplace',
    label: 'Crackling Fireplace',
    category: 'Cozy',
    url: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=600&q=80',
  },
];
