
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DanceElement {
  id: string;
  name: string;
  description: string;
  videoUrl?: string;
  difficulty: Difficulty;
}

export interface Dance {
  id: string;
  name: string;
  elements: DanceElement[];
}

export interface MusicTrack {
  id: string;
  name: string;
  blob: Blob;
  danceId?: string;
}

export interface MusicTrackMetadata {
  id: string;
  name: string;
  danceId?: string;
}
