export interface Podcast {
  id: string;
  title: string;
  author: string;
  description: string;
  artworkUrl: string;
  feedUrl: string;
  genres: string[];
  episodeCount?: number;
  latestReleaseDate?: string;
  /** iTunes artist/publisher ID — present on search/lookup results, absent on RSS chart entries. */
  artistId?: string;
}

export interface Episode {
  id: string;
  podcastId: string;
  title: string;
  description: string;
  audioUrl: string;
  imageUrl?: string;
  podcastTitle?: string;
  duration: number;
  releaseDate: string;
  fileSize?: number;
}

export interface PlaybackProgress {
  episodeId: string;
  position: number;
  duration: number;
  completed: boolean;
  updatedAt: Date;
}

export interface Subscription {
  podcastId: string;
  subscribedAt: Date;
  lastSeen?: string;
}
