import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';   // ✅ pour lien /depenses
import { Subscription } from 'rxjs';

import { ApiService, DashboardDto } from '../../core/services/api.service';
import { PrintButton } from '../../layout/print-button/print-button.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PrintButton],   // ✅ RouterLink ajouté
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit, OnDestroy {

  stats: DashboardDto = this.emptyStats();
  readonly aujourdhui = new Date();

  selectedDate: string = this.today();
  loading = true;
  errorMessage: string | null = null;
  derniereMaj: Date | null = null;             // ✅ heure du dernier chargement

  // ✅ Gestion du cycle de vie
  private subs = new Subscription();
  private focusListener?: () => void;
  private refreshInterval?: ReturnType<typeof setInterval>;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,            // ✅ pour OnPush
  ) {}

  // =================================
  // LIFECYCLE
  // =================================
  ngOnInit(): void {
    this.charger();

    // ✅ 1. Recharge automatiquement quand on revient sur l'onglet
    this.focusListener = () => {
      // Évite de spammer si déjà en cours
      if (!this.loading) this.charger();
    };
    window.addEventListener('focus', this.focusListener);

    // ✅ 2. Recharge toutes les 30 secondes (optionnel)
    // Décommente si tu veux du temps réel "soft"
    // this.refreshInterval = setInterval(() => {
    //   if (!this.loading) this.charger();
    // }, 30_000);
  }

  ngOnDestroy(): void {
    if (this.focusListener) {
      window.removeEventListener('focus', this.focusListener);
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.subs.unsubscribe();
  }

  // =================================
  // CHARGEMENT
  // =================================
  charger(): void {
    this.loading = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    this.subs.add(
      this.api.getDashboard(this.selectedDate).subscribe({
        next: (raw: any) => {
          this.stats = this.normaliser(raw);
          this.derniereMaj = new Date();
          this.loading = false;
          this.cdr.markForCheck();           // ✅ force le rendu OnPush
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage =
            err?.error?.message ||
            (typeof err?.error === 'string' ? err.error : null) ||
            err?.message ||
            'Impossible de charger les statistiques.';
          this.cdr.markForCheck();
        },
      })
    );
  }

  /** ✅ Bouton "Actualiser" manuel */
  actualiser(): void {
    if (this.loading) return;
    this.charger();
  }

  onDateChange(): void {
    this.charger();
  }

  revenirAujourdhui(): void {
    this.selectedDate = this.today();
    this.charger();
  }

  // =================================
  // HELPERS
  // =================================
  private emptyStats(): DashboardDto {
    return {
      date: this.today(),
      montantEncaisseJour: 0,
      quantiteLivreeJour: 0,
      quantiteRegleeJour: 0,
      montantEncaisseLiquide: 0,
      montantEncaisseDepot: 0,
      montantDepenseJour: 0,
      depensesParCategorie: {},
      resultatNet: 0,
      nombreOperations: 0,
    };
  }

  private normaliser(raw: any): DashboardDto {
    const num = (v: any) => (v == null ? 0 : Number(v));

    let dateStr = '';
    if (Array.isArray(raw?.date)) {
      const [y, m, d] = raw.date;
      dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    } else if (typeof raw?.date === 'string') {
      dateStr = raw.date;
    } else {
      dateStr = this.selectedDate;
    }

    const depensesParCategorie: Record<string, number> = {};
    const rawMap = raw?.depensesParCategorie;
    if (rawMap && typeof rawMap === 'object') {
      for (const [cat, montant] of Object.entries(rawMap)) {
        depensesParCategorie[cat] = num(montant);
      }
    }

    return {
      date: dateStr,
      montantEncaisseJour: num(raw?.montantEncaisseJour),
      quantiteLivreeJour: num(raw?.quantiteLivreeJour),
      quantiteRegleeJour: num(raw?.quantiteRegleeJour),
      montantEncaisseLiquide: num(raw?.montantEncaisseLiquide),
      montantEncaisseDepot: num(raw?.montantEncaisseDepot),
      montantDepenseJour: num(raw?.montantDepenseJour),
      depensesParCategorie,
      resultatNet: num(raw?.resultatNet),
      nombreOperations: num(raw?.nombreOperations),
    };
  }

  // =================================
  // GETTERS
  // =================================
  get libelleDate(): string {
    if (!this.stats?.date) return '';
    try {
      const d = new Date(this.stats.date + 'T00:00:00');
      if (isNaN(d.getTime())) return this.stats.date;
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return this.stats.date;
    }
  }

  get dateAujourdhui(): boolean {
    return this.selectedDate === this.today();
  }

  get partLiquide(): number {
    const total = this.stats.montantEncaisseJour;
    if (total === 0) return 0;
    return (this.stats.montantEncaisseLiquide / total) * 100;
  }

  get partDepot(): number {
    const total = this.stats.montantEncaisseJour;
    if (total === 0) return 0;
    return (this.stats.montantEncaisseDepot / total) * 100;
  }

  get partNonRenseigne(): number {
    const total = this.stats.montantEncaisseJour;
    if (total === 0) return 0;
    return (this.montantNonRenseigne / total) * 100;
  }

  get montantNonRenseigne(): number {
    return Math.max(
      0,
      this.stats.montantEncaisseJour
        - this.stats.montantEncaisseLiquide
        - this.stats.montantEncaisseDepot
    );
  }

  get resultatNet(): number {
    return this.stats.montantEncaisseJour - this.stats.montantDepenseJour;
  }

  get resultatPositif(): boolean {
    return this.resultatNet >= 0;
  }

  get depensesParCategorieList(): { categorie: string; montant: number; part: number }[] {
    const total = this.stats.montantDepenseJour;
    const entries = Object.entries(this.stats.depensesParCategorie ?? {});
    return entries
      .map(([categorie, montant]) => ({
        categorie,
        montant,
        part: total > 0 ? (montant / total) * 100 : 0,
      }))
      .sort((a, b) => b.montant - a.montant);
  }

  labelCategorie(cat: string): string {
    const map: Record<string, string> = {
      CARBURANT: 'Carburant',
      ENTRETIEN: 'Entretien',
      SALAIRES: 'Salaires',
      FOURNITURES: 'Fournitures',
      LOYER: 'Loyer',
      TRANSPORT: 'Transport',
      AUTRES: 'Autres',
    };
    return map[cat] ?? cat;
  }

  private today(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const j = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${j}`;
  }
}