import {
  Component, OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ApiService, ClientDto } from '../../core/services/api.service';

type Mode = 'creation' | 'edition' | 'consultation';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrl: './clients.component.scss',
  templateUrl: './clients.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Clients implements OnInit, OnDestroy {

  clients: ClientDto[] = [];

  chargement = true;
  erreur: string | null = null;
  succes: string | null = null;              // ✅ message de succès
  recherche = '';

  // Modale
  modalOuvert = false;
  mode: Mode = 'creation';
  clientSelectionne: ClientDto | null = null;
  nouveauClient: ClientDto = this.clientVide();
  erreurFormulaire: string | null = null;
  enregistrement = false;

  // Suppression
  confirmSuppressionOuverte = false;
  clientASupprimer: ClientDto | null = null;
  suppressionEnCours = false;
  erreurSuppression: string | null = null;

  private succesTimer?: ReturnType<typeof setTimeout>;
  private subs = new Subscription();

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,          // ✅ pour OnPush + setTimeout
  ) {}

  ngOnInit(): void {
    this.chargerClients();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.succesTimer) clearTimeout(this.succesTimer);
  }

  // =================================
  // GETTERS
  // =================================
  get clientsFiltres(): ClientDto[] {
    const q = this.recherche.trim().toLowerCase();
    if (!q) return this.clients;
    return this.clients.filter(c =>
      (c.nomClient ?? '').toLowerCase().includes(q) ||
      (c.telephone ?? '').toLowerCase().includes(q)
    );
  }

  get nombreTotal(): number { return this.clients.length; }

  get soldeTotal(): number {
    return this.clients.reduce((s, c) => s + (c.soldeQuantite ?? 0), 0);
  }

  get clientsAvecSolde(): number {
    return this.clients.filter(c => (c.soldeQuantite ?? 0) > 0).length;
  }

  get premierChargement(): boolean {
    return this.chargement && this.clients.length === 0;
  }

  get rafraichissement(): boolean {
    return this.chargement && this.clients.length > 0;
  }

  get titreModal(): string {
    return this.mode === 'creation'
      ? 'Nouveau client'
      : this.mode === 'edition'
        ? 'Modifier le client'
        : 'Détails du client';
  }

  get iconeModal(): string {
    return this.mode === 'creation'
      ? 'bi-person-plus-fill'
      : this.mode === 'edition'
        ? 'bi-pencil-square'
        : 'bi-eye-fill';
  }

  // =================================
  // CHARGEMENT
  // =================================
  chargerClients(): void {
    this.chargement = true;
    this.erreur = null;

    this.subs.add(
      this.api.getClients().subscribe({
        next: (list) => {
          this.clients = list;
          this.chargement = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.chargement = false;
          this.erreur = err?.error?.message ?? 'Impossible de charger les clients.';
          this.cdr.markForCheck();
        },
      })
    );
  }

  // =================================
  // MODALE
  // =================================
  ouvrirCreation(): void {
    this.mode = 'creation';
    this.nouveauClient = this.clientVide();
    this.erreurFormulaire = null;
    this.enregistrement = false;
    this.modalOuvert = true;
  }

  ouvrirEdition(client: ClientDto): void {
    this.mode = 'edition';
    this.nouveauClient = { ...client };
    this.erreurFormulaire = null;
    this.enregistrement = false;
    this.modalOuvert = true;
  }

  ouvrirConsultation(client: ClientDto): void {
    this.mode = 'consultation';
    this.clientSelectionne = client;
    this.modalOuvert = true;
  }

  fermerModal(): void {
    if (this.enregistrement) return;
    this.modalOuvert = false;
    this.clientSelectionne = null;
    this.erreurFormulaire = null;
  }

  // =================================
  // ENREGISTREMENT (avec message succès)
  // =================================
  enregistrer(): void {
    if (!this.nouveauClient.nomClient?.trim()) {
      this.erreurFormulaire = 'Le nom du client est obligatoire.';
      return;
    }

    this.enregistrement = true;
    this.erreurFormulaire = null;

    const estEdition = this.mode === 'edition' && !!this.nouveauClient.id;
    const nomAffiche = this.nouveauClient.nomClient.trim();

    const payload: ClientDto = {
      nomClient: nomAffiche,
      telephone: this.nouveauClient.telephone?.trim() || undefined,
    };

    const op$ = estEdition
      ? this.api.updateClient(this.nouveauClient.id!, payload)
      : this.api.createClient(payload);

    this.subs.add(
      op$.subscribe({
        next: () => {
          this.enregistrement = false;
          this.modalOuvert = false;

          // ✅ Message de succès visible
          this.afficherSucces(
            estEdition
              ? `Client « ${nomAffiche} » mis à jour avec succès.`
              : `Client « ${nomAffiche} » créé avec succès.`
          );

          // ✅ On reste sur la même page → on recharge la liste
          this.chargerClients();
        },
        error: (err) => {
          this.enregistrement = false;
          this.erreurFormulaire = err?.error?.message
            ?? 'Erreur lors de l\'enregistrement.';
          this.cdr.markForCheck();
        },
      })
    );
  }

  // =================================
  // SUPPRESSION
  // =================================
  demanderSuppression(client: ClientDto): void {
    this.clientASupprimer = client;
    this.erreurSuppression = null;
    this.suppressionEnCours = false;
    this.confirmSuppressionOuverte = true;
  }

  annulerSuppression(): void {
    if (this.suppressionEnCours) return;
    this.confirmSuppressionOuverte = false;
    this.clientASupprimer = null;
    this.erreurSuppression = null;
  }

  confirmerSuppression(): void {
    if (!this.clientASupprimer?.id) return;

    const nomSupprime = this.clientASupprimer.nomClient ?? '';
    this.suppressionEnCours = true;
    this.erreurSuppression = null;

    this.subs.add(
      this.api.deleteClient(this.clientASupprimer.id).subscribe({
        next: () => {
          this.suppressionEnCours = false;
          this.confirmSuppressionOuverte = false;
          this.clientASupprimer = null;

          // ✅ Message de succès
          this.afficherSucces(`Client « ${nomSupprime} » supprimé.`);

          this.chargerClients();
        },
        error: (err) => {
          this.suppressionEnCours = false;
          this.erreurSuppression = err?.error?.message
            ?? 'Erreur lors de la suppression.';
          this.cdr.markForCheck();
        },
      })
    );
  }

  // =================================
  // HELPERS
  // =================================
  private afficherSucces(message: string): void {
    this.succes = message;
    this.cdr.markForCheck();

    if (this.succesTimer) clearTimeout(this.succesTimer);
    this.succesTimer = setTimeout(() => {
      this.succes = null;
      this.cdr.markForCheck();
    }, 4000);   // ✅ auto-effacement après 4 secondes
  }

  fermerSucces(): void {
    this.succes = null;
    if (this.succesTimer) clearTimeout(this.succesTimer);
    this.cdr.markForCheck();
  }

  private clientVide(): ClientDto {
    return { nomClient: '', telephone: '' };
  }
}