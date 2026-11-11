import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  ApiService,
  RapportJourDto,
  LigneRapport,
} from '../../core/services/api.service';

@Component({
  selector: 'app-rapport-jour',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rapport-jour.component.html',
  styleUrl: './rapport-jour.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RapportJour implements OnInit, OnDestroy {

  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  date: string = this.today();
  rapport: RapportJourDto | null = null;

  chargement = false;
  erreur: string | null = null;
  derniereMaj: Date | null = null;
  exportEnCours = false;
  recherche = '';

  private subs = new Subscription();

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
  // CHARGEMENT RAPIDE
  // =================================
  charger(): void {
    this.chargement = true;
    this.erreur = null;
    this.cdr.markForCheck();

    // On NE vide PAS this.rapport pour garder l'affichage pendant le chargement
    this.subs.add(
      this.api.getRapportJour(this.date).subscribe({
        next: (r: RapportJourDto) => {
          this.rapport = r;
          this.chargement = false;
          this.derniereMaj = new Date();
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.chargement = false;
          this.erreur = err.error?.message
            ?? 'Impossible de charger le rapport.';
          this.cdr.markForCheck();
        },
      })
    );
  }

  onDateChange(): void {
    this.charger();
  }

  // =================================
  // GETTERS
  // =================================
  get premierChargement(): boolean {
    return this.chargement && this.rapport === null;
  }

  get rafraichissement(): boolean {
    return this.chargement && this.rapport !== null;
  }

  get lignesFiltrees(): LigneRapport[] {
    const lignes = this.rapport?.lignes ?? [];
    const q = this.recherche.trim().toLowerCase();
    if (!q) return lignes;
    return lignes.filter(l =>
      (l.nomClient ?? '').toLowerCase().includes(q) ||
      (l.telephone ?? '').toLowerCase().includes(q)
    );
  }

  // =================================
  // EXPORT PDF
  // =================================
  exporterPdf(): void {
    if (!this.rapport || !this.rapport.lignes.length) return;

    this.exportEnCours = true;
    this.cdr.markForCheck();

    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const dateFr = new Date(this.rapport.date).toLocaleDateString('fr-FR');

      // ---- En-tête ----
      doc.setFontSize(18);
      doc.setTextColor(30, 64, 124); // Bleu foncé
      doc.text('Rapport journalier — Soldes clients', 14, 18);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Date : ${dateFr}`, 14, 26);
      doc.text(
        `Généré le ${new Date().toLocaleString('fr-FR')}`,
        14, 32
      );

      // ---- Tableau ----
      autoTable(doc, {
        startY: 40,
        theme: 'grid',
        head: [[
          'Client', 'Téléphone',
          'Livré (j)', 'Réglé (j)', 'Reste à payer'
        ]],
        body: this.rapport.lignes.map(l => [
          l.nomClient,
          l.telephone ?? '—',
          this.fmt(l.quantiteLivreeJour),
          this.fmt(l.quantiteRegleeJour),
          this.fmt(l.soldeActuel),
        ]),
        foot: [[
          'TOTAL',
          '',
          this.fmt(this.rapport.totalLivreJour),
          this.fmt(this.rapport.totalRegleJour),
          this.fmt(this.rapport.totalSoldeGlobal),
        ]],
        styles: { 
          fontSize: 9, 
          cellPadding: 3,
          textColor: [50, 50, 50],
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        headStyles: { 
          fillColor: [30, 64, 124], 
          textColor: 255,
          fontStyle: 'bold',
          lineColor: [30, 64, 124], 
          lineWidth: 0.2,
        },
        footStyles: { 
          fillColor: [30, 64, 124],  // ✅ Fond bleu foncé pour le TOTAL
          textColor: [255, 255, 255], // ✅ Texte blanc
          fontStyle: 'bold',
          fontSize: 10,
          lineColor: [30, 64, 124],
          lineWidth: 0.3,
        },
        alternateRowStyles: { 
          fillColor: [248, 249, 250] 
        },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 35 },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { 
            halign: 'right', 
            fontStyle: 'bold', 
            textColor: [220, 38, 38] // Reste à payer en rouge
          },
        },
        // ✅ LA CORRECTION EST ICI : didParseCell est DANS l'objet autoTable
        didParseCell: (data) => {
          // Lignes normales : Reste à payer en rouge
          if (data.section === 'body' && data.column.index === 4) {
            data.cell.styles.textColor = [220, 38, 38];
          }
          // Ligne du bas (TOTAL) : on force le texte en blanc
          if (data.section === 'foot') {
            data.cell.styles.textColor = [255, 255, 255]; 
            // Le total "Reste à payer" en jaune clair pour ressortir
            if (data.column.index === 4) {
              data.cell.styles.textColor = [253, 224, 71]; // Jaune
            }
          }
        }
      }); // ✅ Fermeture correcte de l'objet autoTable

      // ---- Pied de page ----
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} / ${pages} — FleetLog`,
          14,
          doc.internal.pageSize.getHeight() - 10
        );
      }

      doc.save(`rapport-clients-${this.rapport.date}.pdf`);
    } finally {
      this.exportEnCours = false;
      this.cdr.markForCheck();
    }
  }

  // =================================
  // UTILITAIRES
  // =================================
  private fmt(v: number | null | undefined): string {
    return (v ?? 0).toFixed(2);
  }

  private today(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const j = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${j}`;
  }
}