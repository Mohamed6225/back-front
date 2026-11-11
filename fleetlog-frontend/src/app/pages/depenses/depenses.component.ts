import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  ApiService,
  DepenseDto,
  CategorieDepense,
  ModePaiement,
} from '../../core/services/api.service';

@Component({
  selector: 'app-depenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './depenses.component.html',
  styleUrl: './depenses.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Depenses implements OnInit, OnDestroy {

  // ---------- Données ----------
  depenses: DepenseDto[] = [];
  selectedDate: string = this.today();

  // ---------- État ----------
  chargement = true;
  erreur: string | null = null;
  succes: string | null = null;                 // ✅ nouveau
  derniereMaj: Date | null = null;              // ✅ nouveau

  // ---------- Modale création/édition ----------
  modalOuvert = false;
  mode: 'creation' | 'edition' = 'creation';
  form: DepenseDto = this.vide();
  erreurForm: string | null = null;             // ✅ string au lieu de boolean
  enregistrement = false;

  // ---------- Confirmation suppression ----------
  confirmSuppressionOuverte = false;            // ✅ modale custom
  depenseASupprimer: DepenseDto | null = null;
  suppressionEnCours = false;
  erreurSuppression: string | null = null;

  // ---------- Catégories ----------
  readonly categories: { value: CategorieDepense; label: string }[] = [
    { value: 'CARBURANT',   label: 'Carburant' },
    { value: 'ENTRETIEN',   label: 'Entretien' },
    { value: 'SALAIRES',    label: 'Salaires' },
    { value: 'FOURNITURES', label: 'Fournitures' },
    { value: 'LOYER',       label: 'Loyer' },
    { value: 'TRANSPORT',   label: 'Transport' },
    { value: 'AUTRES',      label: 'Autres' },
  ];

  private subs = new Subscription();
  private succesTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,             // ✅
  ) {}

  // =================================
  // LIFECYCLE
  // =================================
  ngOnInit(): void {
    this.charger();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.succesTimer) clearTimeout(this.succesTimer);
  }

  // =================================
  // GETTERS
  // =================================
  get totalJour(): number {
    return this.depenses.reduce((s, d) => s + (d.montant ?? 0), 0);
  }

  get nombreOperations(): number {
    return this.depenses.length;
  }

  get premiereChargee(): boolean {
    return this.chargement && this.depenses.length === 0;
  }

  get rafraichissement(): boolean {
    return this.chargement && this.depenses.length > 0;
  }

  // =================================
  // CHARGEMENT
  // =================================
  charger(): void {
    this.chargement = true;
    this.erreur = null;
    this.cdr.markForCheck();

    this.subs.add(
      this.api.listerDepenses(this.selectedDate).subscribe({
        next: (list) => {
          this.depenses = list;
          this.chargement = false;
          this.derniereMaj = new Date();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.chargement = false;
          this.erreur = err?.error?.message ?? 'Impossible de charger les dépenses.';
          this.cdr.markForCheck();
        },
      })
    );
  }

  onDateChange(): void {
    this.charger();
  }

  // =================================
  // MODALE CRÉATION / ÉDITION
  // =================================
  ouvrirCreation(): void {
    this.mode = 'creation';
    this.form = this.vide();
    this.erreurForm = null;
    this.enregistrement = false;
    this.modalOuvert = true;
  }

  ouvrirEdition(d: DepenseDto): void {
    this.mode = 'edition';
    this.form = { ...d };
    this.erreurForm = null;
    this.enregistrement = false;
    this.modalOuvert = true;
  }

  fermer(): void {
    if (this.enregistrement) return;
    this.modalOuvert = false;
    this.erreurForm = null;
  }

  enregistrer(): void {
    // Validation
    if (!this.form.libelle?.trim()) {
      this.erreurForm = 'Le libellé est obligatoire.';
      return;
    }
    if (!this.form.categorie) {
      this.erreurForm = 'La catégorie est obligatoire.';
      return;
    }
    if (!this.form.montant || this.form.montant <= 0) {
      this.erreurForm = 'Le montant doit être supérieur à zéro.';
      return;
    }
    if (!this.form.dateDepense) {
      this.erreurForm = 'La date est obligatoire.';
      return;
    }

    this.enregistrement = true;
    this.erreurForm = null;

    const estEdition = this.mode === 'edition' && !!this.form.id;
    const libelleAffiche = this.form.libelle.trim();

    const obs = estEdition
      ? this.api.modifierDepense(this.form.id!, this.form)
      : this.api.creerDepense(this.form);

    this.subs.add(
      obs.subscribe({
        next: () => {
          this.enregistrement = false;
          this.modalOuvert = false;

          // ✅ Message de succès
          this.afficherSucces(
            estEdition
              ? `Dépense « ${libelleAffiche} » modifiée avec succès.`
              : `Dépense « ${libelleAffiche} » créée avec succès.`
          );

          this.charger();
        },
        error: (err) => {
          this.enregistrement = false;
          this.erreurForm = err?.error?.message
            ?? 'Erreur lors de l\'enregistrement.';
          this.cdr.markForCheck();
        },
      })
    );
  }

  // =================================
  // SUPPRESSION (avec modale custom)
  // =================================
  demanderSuppression(d: DepenseDto): void {
    this.depenseASupprimer = d;
    this.erreurSuppression = null;
    this.suppressionEnCours = false;
    this.confirmSuppressionOuverte = true;
  }

  annulerSuppression(): void {
    if (this.suppressionEnCours) return;
    this.confirmSuppressionOuverte = false;
    this.depenseASupprimer = null;
    this.erreurSuppression = null;
  }

  confirmerSuppression(): void {
    if (!this.depenseASupprimer?.id) return;

    const libelle = this.depenseASupprimer.libelle ?? '';
    this.suppressionEnCours = true;
    this.erreurSuppression = null;

    this.subs.add(
      this.api.supprimerDepense(this.depenseASupprimer.id).subscribe({
        next: () => {
          this.suppressionEnCours = false;
          this.confirmSuppressionOuverte = false;
          this.depenseASupprimer = null;

          this.afficherSucces(`Dépense « ${libelle} » supprimée.`);
          this.charger();
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
  labelCategorie(c: CategorieDepense | string): string {
    const found = this.categories.find(x => x.value === c);
    return found?.label ?? String(c);
  }

  modeLabel(mode: ModePaiement | null | undefined): string {
    if (mode === 'LIQUIDE') return 'Liquide';
    if (mode === 'DEPOT') return 'Dépôt';
    return '—';
  }

  fermerSucces(): void {
    this.succes = null;
    if (this.succesTimer) clearTimeout(this.succesTimer);
    this.cdr.markForCheck();
  }

  private afficherSucces(message: string): void {
    this.succes = message;
    this.cdr.markForCheck();

    if (this.succesTimer) clearTimeout(this.succesTimer);
    this.succesTimer = setTimeout(() => {
      this.succes = null;
      this.cdr.markForCheck();
    }, 4000);
  }

  private vide(): DepenseDto {
    return {
      libelle: '',
      categorie: 'AUTRES',
      montant: 0,
      dateDepense: this.selectedDate,
      modePaiement: null,
      description: '',
    };
  }

  private today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
}