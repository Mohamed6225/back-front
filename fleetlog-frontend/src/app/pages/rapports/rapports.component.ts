import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ApiService, ClientDto } from '../../core/services/api.service';

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './rapports.component.html',
  styleUrl: './rapports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Rapports implements OnInit, OnDestroy {

  // ---------- Données ----------
  clients: ClientDto[] = [];
  recherche = '';

  // ---------- État ----------
  chargement = true;
  erreur: string | null = null;
  derniereMaj: Date | null = null;

  private subs = new Subscription();

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,          // ✅ pour OnPush
  ) {}

  // =================================
  // LIFECYCLE
  // =================================
  ngOnInit(): void {
    this.charger();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // =================================
  // CHARGEMENT
  // =================================
  charger(): void {
    this.chargement = true;
    this.erreur = null;
    this.cdr.markForCheck();

    this.subs.add(
      this.api.getClients().subscribe({
        next: (list) => {
          this.clients = list;
          this.chargement = false;
          this.derniereMaj = new Date();
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


  get premierChargement(): boolean {
    return this.chargement && this.clients.length === 0;
  }

 
  get rafraichissement(): boolean {
    return this.chargement && this.clients.length > 0;
  }

  get nombreTotal(): number {
    return this.clients.length;
  }

  get soldeTotal(): number {
    return this.clients.reduce((s, c) => s + (c.soldeQuantite ?? 0), 0);
  }
}