package garba.demo.Service;

import garba.demo.API.IAuto;
import garba.demo.API.Impl.AutoImpl;
import garba.demo.domaine.Livraison;
import garba.demo.dto.*;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AutoService implements IAuto {

    // ✅ UNE SEULE dépendance : l'implémentation réelle
    private final AutoImpl autoImpl;

    // =========================================
    // CLIENTS
    // =========================================

    @Override
    public ClientDto creerClient(ClientDto dto) {
        return autoImpl.creerClient(dto);
    }

    @Override
    public List<ClientDto> listerClients() {
        return autoImpl.listerClients();
    }

    @Override
    public ClientDto rechercherClient(Long id) {
        return autoImpl.rechercherClient(id);
    }

    @Override
    public ClientDto modifierClient(Long id, ClientDto dto) {
        return autoImpl.modifierClient(id, dto);
    }

    @Override
    public void supprimerClient(Long id) {
        autoImpl.supprimerClient(id);
    }

    // =========================================
    // LIVRAISONS  ← TOUTE LA LOGIQUE EST DANS AutoImpl
    // =========================================

    @Override
    public Livraison enregistrerLivraison(LivraisonDto dto) {
        return autoImpl.enregistrerLivraison(dto);
    }

    // =========================================
    // SITUATION / HISTORIQUE
    // =========================================

    @Override
    public SituationClientDto consulterSituation(Long clientId) {
        return autoImpl.consulterSituation(clientId);
    }

    @Override
    public List<Livraison> historiqueClient(Long clientId) {
        return autoImpl.historiqueClient(clientId);
    }

    // =========================================
    // DASHBOARD
    // =========================================

    @Override
    public DashboardDto getDashboard(LocalDate date) {
        return autoImpl.getDashboard(date);
    }

    // =========================================
    // DÉPENSES
    // =========================================

    @Override
    public List<DepenseDto> listerDepenses(LocalDate date) {
        return autoImpl.listerDepenses(date);
    }

    @Override
    public DepenseDto creerDepense(DepenseDto dto) {
        return autoImpl.creerDepense(dto);
    }

    @Override
    public DepenseDto modifierDepense(Long id, DepenseDto dto) {
        return autoImpl.modifierDepense(id, dto);
    }

    @Override
    public void supprimerDepense(Long id) {
        autoImpl.supprimerDepense(id);
    }



    @Override
    public RapportJourDto getRapportJour(LocalDate date) {
        return autoImpl.getRapportJour(date);
    }
}