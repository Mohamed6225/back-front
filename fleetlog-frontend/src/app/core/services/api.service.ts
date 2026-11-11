import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// =============================================================
// TYPES DE BASE (en premier — utilisés partout en dessous)
// =============================================================

export type ModePaiement = 'LIQUIDE' | 'DEPOT';

export type CategorieDepense =
  | 'CARBURANT'
  | 'ENTRETIEN'
  | 'SALAIRES'
  | 'FOURNITURES'
  | 'LOYER'
  | 'TRANSPORT'
  | 'AUTRES';

// =============================================================
// CLIENTS
// =============================================================

export interface ClientDto {
  id?: number;
  nomClient: string;
  telephone?: string;
  soldeQuantite?: number;
}

export interface LigneRapport {
  clientId: number;
  nomClient: string;
  telephone?: string;
  quantiteLivreeJour: number;
  quantiteRegleeJour: number;
  soldeActuel: number;
}

export interface RapportJourDto {
  date: string;
  lignes: LigneRapport[];
  totalLivreJour: number;
  totalRegleJour: number;
  totalSoldeGlobal: number;
}

// =============================================================
// LIVRAISONS
// =============================================================

export interface LivraisonDto {
  clientId: number;
  dateLivraison: string;                    // "yyyy-MM-dd"
  quantiteLivree?: number | null;            // facultatif (0 si non saisi)
  quantiteReglee?: number | null;            // facultatif
  prixUnitaire?: number | null;              // facultatif
  montantEncaisse?: number | null;           // facultatif
  modePaiement?: ModePaiement | null;        // requis seulement si règlement
}

export interface Livraison {
  id: number;
  client: ClientDto;
  dateLivraison: string;
  quantiteLivree: number;
  quantiteReglee: number;
  prixUnitaire: number;
  montantEncaisse: number;
  modePaiement: ModePaiement | null;
  ancienSolde: number;
  nouveauSolde: number;
}

export interface SituationClientDto {
  clientId: number;
  nomClient: string;
  soldeQuantite: number;
}

// =============================================================
// DÉPENSES
// =============================================================

export interface DepenseDto {
  id?: number;
  libelle: string;
  categorie: CategorieDepense;
  montant: number;
  dateDepense: string;
  modePaiement?: ModePaiement | null;
  description?: string;
}

// =============================================================
// DASHBOARD  (une seule déclaration, complète)
// =============================================================

export interface DashboardDto {
  date: string;
  montantEncaisseJour: number;
  quantiteLivreeJour: number;
  quantiteRegleeJour: number;
  montantEncaisseLiquide: number;
  montantEncaisseDepot: number;
  montantDepenseJour: number;
  depensesParCategorie: Record<string, number>;
  resultatNet: number;
  nombreOperations: number;
}

// =============================================================
// SERVICE
// =============================================================

@Injectable({ providedIn: 'root' })
export class ApiService {

  private readonly apiUrl = 'http://localhost:8081/api/auto';

  constructor(private http: HttpClient) {}

  // ---------- CLIENTS ----------

  getClients(): Observable<ClientDto[]> {
    return this.http.get<ClientDto[]>(`${this.apiUrl}/clients`);
  }

  getClient(id: number): Observable<ClientDto> {
    return this.http.get<ClientDto>(`${this.apiUrl}/clients/${id}`);
  }

  createClient(dto: ClientDto): Observable<ClientDto> {
    return this.http.post<ClientDto>(`${this.apiUrl}/clients`, dto);
  }

  updateClient(id: number, dto: ClientDto): Observable<ClientDto> {
    return this.http.put<ClientDto>(`${this.apiUrl}/clients/${id}`, dto);
  }

  deleteClient(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/clients/${id}`, {
      responseType: 'text',
    });
  }

  // ---------- LIVRAISONS ----------

  createLivraison(dto: LivraisonDto): Observable<Livraison> {
    return this.http.post<Livraison>(`${this.apiUrl}/livraisons`, dto);
  }

  // ---------- SITUATION / HISTORIQUE ----------

  getSituation(id: number): Observable<SituationClientDto> {
    return this.http.get<SituationClientDto>(
      `${this.apiUrl}/clients/${id}/situation`
    );
  }

  getHistorique(id: number): Observable<Livraison[]> {
    return this.http.get<Livraison[]>(
      `${this.apiUrl}/clients/${id}/historique`
    );
  }

  // ---------- DASHBOARD ----------

  getDashboard(date?: string): Observable<DashboardDto> {
    const params: Record<string, string> = {};
    if (date) params['date'] = date;
    return this.http.get<DashboardDto>(`${this.apiUrl}/dashboard`, { params });
  }

  // ---------- DÉPENSES ----------

  listerDepenses(date?: string): Observable<DepenseDto[]> {
    const url = date
      ? `${this.apiUrl}/depenses?date=${date}`
      : `${this.apiUrl}/depenses`;
    return this.http.get<DepenseDto[]>(url);
  }

  creerDepense(dto: DepenseDto): Observable<DepenseDto> {
    return this.http.post<DepenseDto>(`${this.apiUrl}/depenses`, dto);
  }

  modifierDepense(id: number, dto: DepenseDto): Observable<DepenseDto> {
    return this.http.put<DepenseDto>(`${this.apiUrl}/depenses/${id}`, dto);
  }

  supprimerDepense(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/depenses/${id}`, {
      responseType: 'text',
    });
  }

  getRapportJour(date?: string): Observable<RapportJourDto> {
  const params: Record<string, string> = {};
  if (date) params['date'] = date;
  return this.http.get<RapportJourDto>(
    `${this.apiUrl}/rapport-du-jour`, { params }
  );
}
}