export interface PodcastCategory {
  id: number;
  name: string;
  color: string;
}

export const PODCAST_CATEGORIES: PodcastCategory[] = [
  { id: 0, name: 'All', color: '#1A73E8' },
  { id: 1489, name: 'News', color: '#EA4335' },
  { id: 1304, name: 'Education', color: '#34A853' },
  { id: 1303, name: 'Comedy', color: '#FBBC04' },
  { id: 1301, name: 'Arts', color: '#9C27B0' },
  { id: 1533, name: 'Science', color: '#00ACC1' },
  { id: 1318, name: 'Technology', color: '#FF5722' },
  { id: 1321, name: 'Business', color: '#607D8B' },
  { id: 1309, name: 'TV & Film', color: '#3F51B5' },
  { id: 1310, name: 'Music', color: '#4CAF50' },
  { id: 1545, name: 'Sports', color: '#FF9800' },
  { id: 1488, name: 'True Crime', color: '#424242' },
];
