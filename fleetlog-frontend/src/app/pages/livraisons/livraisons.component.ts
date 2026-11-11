import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  ApiService,
  ClientDto,
  Livraison,
  LivraisonDto,
  ModePaiement,
  SituationClientDto,
} from '../../core/services/api.service';

@Component({
  selector: 'app-livraisons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './livraisons.component.html',
  styleUrl: './livraisons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Livraisons implements OnInit, OnDestroy {

  clients: ClientDto[] = [];
  selectedClientId: number | null = null;
  situation: SituationClientDto | null = null;
  historique: Livraison[] = [];

  loadingClients = false;
  loadingSituation = false;
  submitting = false;

  succes: string | null = null;
  erreur: string | null = null;
  derniereMaj: Date | null = null;

  form = {
    dateLivraison: this.today(),
    quantiteLivree: null as number | null,
    quantiteReglee: null as number | null,
    prixUnitaire: null as number | null,
    montantEncaisse: null as number | null,
    modePaiement: null as ModePaiement | null,
  };

  private subs = new Subscription();
  private succesTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.chargerClients();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.succesTimer) clearTimeout(this.succesTimer);
  }

  // =================================
  // GETTERS CALCULÉS
  // =================================
  get ancienSolde(): number {
    return this.situation?.soldeQuantite ?? 0;
  }

  get quantiteDisponible(): number {
    return this.ancienSolde + (this.form.quantiteLivree ?? 0);
  }

  get nouveauSolde(): number {
    return this.quantiteDisponible - (this.form.quantiteReglee ?? 0);
  }

  get montantTheorique(): number {
    return (this.form.quantiteReglee ?? 0) * (this.form.prixUnitaire ?? 0);
  }

  get regleeDepasse(): boolean {
    return (this.form.quantiteReglee ?? 0) > this.quantiteDisponible;
  }

  get paiementEffectue(): boolean {
    return (this.form.montantEncaisse ?? 0) > 0
        || (this.form.quantiteReglee ?? 0) > 0;
  }

  get paiementSeul(): boolean {
    return (this.form.quantiteLivree ?? 0) === 0
        && (this.form.quantiteReglee ?? 0) > 0;
  }

  // ✅ CORRIGÉ : seul le client, la date et au moins une quantité > 0 sont requis.
  //    Prix unitaire et montant encaissé sont FACULTATIFS.
  //    Mode de paiement requis UNIQUEMENT si un règlement est effectué.
  get formValide(): boolean {
    const livree = this.form.quantiteLivree ?? 0;
    const reglee = this.form.quantiteReglee ?? 0;

    return (
      this.selectedClientId !== null &&
      !!this.form.dateLivraison &&
      (livree > 0 || reglee > 0) &&
      livree >= 0 &&
      reglee >= 0 &&
      !this.regleeDepasse &&
      (!this.paiementEffectue || this.form.modePaiement !== null)
    );
  }

  // =================================
  // CHARGEMENT CLIENTS
  // =================================
  private chargerClients(): void {
    this.loadingClients = true;
    this.cdr.markForCheck();

    this.subs.add(
      this.api.getClients().subscribe({
        next: (data) => {
          this.clients = data;
          this.loadingClients = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingClients = false;
          this.showError(this.extractError(err));
        },
      })
    );
  }

  // =================================
  // SÉLECTION CLIENT
  // =================================
  onClientChange(): void {
    this.erreur = null;
    this.succes = null;

    if (this.selectedClientId == null) {
      this.situation = null;
      this.historique = [];
      this.cdr.markForCheck();
      return;
    }

    this.chargerSituation(this.selectedClientId);
    this.chargerHistorique(this.selectedClientId);
  }

  private chargerSituation(clientId: number): void {
    this.loadingSituation = true;
    this.cdr.markForCheck();

    this.subs.add(
      this.api.getSituation(clientId).subscribe({
        next: (s) => {
          this.situation = s;
          this.loadingSituation = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingSituation = false;
          this.showError(this.extractError(err));
        },
      })
    );
  }

  private chargerHistorique(clientId: number): void {
    this.subs.add(
      this.api.getHistorique(clientId).subscribe({
        next: (h) => {
          this.historique = h;
          this.derniereMaj = new Date();
          this.cdr.markForCheck();
        },
        error: (err) => this.showError(this.extractError(err)),
      })
    );
  }

  // =================================
  // ENREGISTREMENT
  // =================================
  onSubmit(): void {
    this.erreur = null;
    this.succes = null;

    if (!this.formValide) {
      this.showError(
        'Veuillez saisir au moins une quantité (livrée ou réglée). '
        + 'Un mode de paiement est obligatoire uniquement si un règlement est effectué.'
      );
      return;
    }

    // ✅ Les champs facultatifs non saisis sont envoyés en 0
    const dto: LivraisonDto = {
      clientId: this.selectedClientId!,
      dateLivraison: this.form.dateLivraison,
      quantiteLivree: Number(this.form.quantiteLivree ?? 0),
      quantiteReglee: Number(this.form.quantiteReglee ?? 0),
      prixUnitaire: Number(this.form.prixUnitaire ?? 0),
      montantEncaisse: Number(this.form.montantEncaisse ?? 0),
      modePaiement: this.paiementEffectue ? this.form.modePaiement! : null,
    };

    this.submitting = true;
    this.cdr.markForCheck();

    this.subs.add(
      this.api.createLivraison(dto).subscribe({
        next: () => {
          this.submitting = false;

          this.showSuccess(
            this.paiementSeul
              ? 'Règlement d\'ancien solde enregistré avec succès.'
              : 'Livraison enregistrée avec succès.'
          );

          this.chargerSituation(dto.clientId);
          this.chargerHistorique(dto.clientId);
          this.resetForm();
        },
        error: (err) => {
          this.submitting = false;
          this.showError(this.extractError(err));
        },
      })
    );
  }

  // =================================
  // RÉINITIALISATION
  // =================================
  private resetForm(): void {
    this.form = {
      dateLivraison: this.today(),
      quantiteLivree: null,
      quantiteReglee: null,
      prixUnitaire: null,
      montantEncaisse: null,
      modePaiement: null,
    };
    this.cdr.markForCheck();
  }

  // =================================
  // UTILITAIRES
  // =================================
  private today(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const j = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${j}`;
  }

  private showSuccess(text: string): void {
    this.succes = text;
    this.erreur = null;
    this.cdr.markForCheck();

    if (this.succesTimer) clearTimeout(this.succesTimer);
    this.succesTimer = setTimeout(() => {
      this.succes = null;
      this.cdr.markForCheck();
    }, 4000);
  }

  private showError(text: string): void {
    this.erreur = text;
    this.succes = null;
    this.cdr.markForCheck();
  }

  fermerSucces(): void {
    this.succes = null;
    if (this.succesTimer) clearTimeout(this.succesTimer);
    this.cdr.markForCheck();
  }

  fermerErreur(): void {
    this.erreur = null;
    this.cdr.markForCheck();
  }

  private extractError(err: any): string {
    return (
      err?.error?.message ||
      (typeof err?.error === 'string' ? err.error : null) ||
      err?.message ||
      'Une erreur est survenue.'
    );
  }
}