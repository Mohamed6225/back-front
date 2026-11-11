import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';

import {
  ApiService,
  ClientDto,
  Livraison,
  SituationClientDto,
} from '../../core/services/api.service';

import { PrintButton } from '../../layout/print-button/print-button.component';

@Component({
  selector: 'app-releve',
  standalone: true,
  styleUrl: './releve.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './releve.component.html',
  imports: [CommonModule, DatePipe, PrintButton],
})
export class Releve implements OnInit, OnDestroy {

  // ---------- Données ----------
  client: ClientDto | null = null;
  situation: SituationClientDto | null = null;
  historique: Livraison[] = [];
  erreur: string | null = null;
  chargement = true;

  // ---------- Métadonnées ----------
  readonly aujourdhui = new Date();
  readonly todayKey = new Date()
    .toISOString()
    .substring(0, 10)
    .replace(/-/g, '');

  private subs = new Subscription();
  private clientId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,           // ✅ pour OnPush
  ) {}

  // =================================
  // LIFECYCLE
  // =================================
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;

    if (!idParam || isNaN(id) || id <= 0) {
      this.erreur = 'Identifiant client invalide.';
      this.chargement = false;
      this.cdr.markForCheck();
      return;
    }

    this.clientId = id;
    this.charger();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // =================================
  // CHARGEMENT — 1 seul aller-retour groupé
  // =================================
  charger(): void {
    if (this.clientId == null) return;

    this.chargement = true;
    this.erreur = null;
    this.cdr.markForCheck();

    // ✅ forkJoin : les 3 appels en parallèle, 1 seule attente
    this.subs.add(
      forkJoin({
        client: this.api.getClient(this.clientId),
        situation: this.api.getSituation(this.clientId),
        historique: this.api.getHistorique(this.clientId),
      }).subscribe({
        next: ({ client, situation, historique }) => {
          this.client = client;
          this.situation = situation;
          this.historique = historique;
          this.chargement = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.chargement = false;
          this.erreur =
            err?.error?.message ||
            (typeof err?.error === 'string' ? err.error : null) ||
            err?.message ||
            'Impossible de charger le relevé.';
          this.cdr.markForCheck();
        },
      })
    );
  }

  /** ✅ Bouton "Réessayer" en cas d'erreur */
  reessayer(): void {
    this.charger();
  }

  // =================================
  // HELPERS
  // =================================
  labelMode(mode: string | null | undefined): string {
    if (mode === 'LIQUIDE') return 'Liquide';
    if (mode === 'DEPOT') return 'Dépôt';
    return '—';
  }

  get totalLivre(): number {
    return this.historique.reduce(
      (s, l) => s + (l.quantiteLivree ?? 0), 0
    );
  }

  get totalRegle(): number {
    return this.historique.reduce(
      (s, l) => s + (l.quantiteReglee ?? 0), 0
    );
  }

  get totalEncaisse(): number {
    return this.historique.reduce(
      (s, l) => s + (l.montantEncaisse ?? 0), 0
    );
  }

  retour(): void {
    this.router.navigate(['/clients']);
  }
}