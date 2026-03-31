export interface AnimalPhoto {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface AnimalBreed {
  id: string;
  name: string;
}

export interface Animal {
  id: string;
  ownerId?: string;
  name: string;
  species: 'CHIEN' | 'CHAT' | 'AUTRE';
  breed?: AnimalBreed;
  breedId?: string;
  age?: number;
  sex?: string;
  size?: string;
  temperament?: string;
  city?: string;
  description?: string;
  vaccinated?: boolean;
  spayed?: boolean;
  dewormed?: boolean;
  color?: string;
  medicalConditions?: string;
  status: 'DISPONIBLE' | 'ADOPTE' | 'ATTENTE_VALIDATION' | 'REJETE' | 'EN_COURS_ADOPTION';
  photos: AnimalPhoto[];
  owner?: {
    id: string;
    profile?: {
      firstName: string;
      lastName: string;
      city: string;
      avatarUrl?: string;
    };
  };
  createdAt: string;
  matchScore?: number;
}

export type AnimalsResponse = Animal[];