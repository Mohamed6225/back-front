

export interface Vehicule {
  id: number;
  immatriculation: string;
  marque: string;
  annee: number;
  type: string;
  capacite: number;
  statut: 'DISPONIBLE' | 'AFFECTE' | 'EN_MAINTENANCE' | 'HORS_SERVICE';
}

export interface VehiculeCreation {
  immatriculation: string;
  marque: string;
  annee: number;
  type: string;
  capacite: number;
  statut: string;
}

export interface VehiculeDtoList {
  vehicules: Vehicule[];
  total: number;
}



export type StatutChauffeur = 'ACTIF' | 'INACTIF';

export interface Chauffeur {
  id: number;
  prenom: string;
  nom: string;
  telephone: string;
  numeroPermis: string;
  categoriePermis: string;
  dateExpirationPermis: string;
  statut: StatutChauffeur;
}

export type ChauffeurCreation = Omit<Chauffeur, 'id'>;

export interface ChauffeurDtoList {
  chauffeurs: Chauffeur[];
}



export interface Fuel {
  id: number;
  vehiculeId: number;
  dateCarburant: string;
  quantite: number;
  prixUnitaire: number;
  station: string;
  prixTotal: number;
}

export interface CarburantCreation {
  vehiculeId: number | null;
  dateCarburant: string;
  quantite: number | null;
  prixUnitaire: number | null;
  station: string;
}

export interface CarburantDtoList {
  carburants: Fuel[];
}

// Pour le select des véhicules dans le formulaire
export interface VehiculeSimple {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
}



export type StatutMaintenance =
  | 'PLANIFIEE'
  | 'EN_COURS'
  | 'TERMINEE'
  | 'ANNULEE';

export interface Maintenance {
  id: number;
  vehiculeId: number;
  dateMaintenance: string;
  description: string;
  cout: number | null;
  statut: StatutMaintenance | string;
}

export interface MaintenanceCreation {
  vehiculeId: number | null;
  dateMaintenance: string;
  description: string;
  cout: number | null;
}

export interface MaintenanceDtoList {
  maintenances: Maintenance[];
  total: number;
}



export type StatutMission =
  | 'PLANIFIEE'
  | 'EN_COURS'
  | 'TERMINEE'
  | 'ANNULEE';

export interface Mission {
  id: number;
  vehiculeId: number;
  chauffeurId: number;
  datedepart: string;
  dateretour: string | null;
  statut: StatutMission | string;
}

export interface MissionCreation {
  vehiculeId: number | null;
  chauffeurId: number | null;
  datedepart: string;
  dateretour: string | null;
  statut?: StatutMission;
}

export interface MissionsDtoList {
  missions: Mission[];
  total: number;
}
