import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard.component';
import { Livraisons } from './pages/livraisons/livraisons.component';
import { Clients } from './pages/clients/clients.component';
import { Releve } from './pages/releve/releve.component';
import { Depenses } from './pages/depenses/depenses.component';
import { RapportJour} from './pages/rapport-jour/rapport-jour.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  { path: 'dashboard', component: Dashboard },

  { path: 'livraisons', component: Livraisons },
  { path: 'clients', component: Clients },

  // ✅ Rélevé d'un client
  { path: 'clients/:id/releve', component: Releve },

  // ✅ Rapport journalier PDF
  { path: 'rapport-jour', component: RapportJour},

  // ✅ Raccourci : /releve redirige vers la liste des clients
  { path: 'releve', redirectTo: 'clients', pathMatch: 'full' },

  { path: 'depenses', component: Depenses },

  { path: '**', redirectTo: 'dashboard' },
];