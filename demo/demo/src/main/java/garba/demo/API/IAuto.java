package garba.demo.API;

import garba.demo.domaine.Livraison;
import garba.demo.dto.*;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.util.List;

public interface IAuto {

    ClientDto creerClient(ClientDto dto);

    List<ClientDto> listerClients();

    ClientDto rechercherClient(Long id);

    ClientDto modifierClient(Long id, ClientDto dto);

    void supprimerClient(Long id);

    Livraison enregistrerLivraison(LivraisonDto dto);

    SituationClientDto consulterSituation(Long clientId);

    List<Livraison> historiqueClient(Long clientId);

    @Transactional(Transactional.TxType.SUPPORTS)
    DashboardDto getDashboard(LocalDate date);

    List<DepenseDto> listerDepenses(LocalDate date);
    DepenseDto creerDepense(DepenseDto dto);
    DepenseDto modifierDepense(Long id, DepenseDto dto);
    void supprimerDepense(Long id);

    RapportJourDto getRapportJour(LocalDate date);
}