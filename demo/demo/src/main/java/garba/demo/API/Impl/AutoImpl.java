package garba.demo.API.Impl;

import garba.demo.API.IAuto;
import garba.demo.Repository.ClientRepository;
import garba.demo.Repository.DepenseRepository;
import garba.demo.Repository.LivraisonRepository;
import garba.demo.domaine.Client;
import garba.demo.domaine.Depense;
import garba.demo.domaine.Livraison;
import garba.demo.domaine.ModePaiement;
import garba.demo.dto.*;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AutoImpl implements IAuto {

    private final ClientRepository clientRepository;
    private final LivraisonRepository livraisonRepository;
    private final DepenseRepository depenseRepository;

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    // -------- Helpers --------

    private ClientDto convertirClient(Client client) {
        return ClientDto.builder()
                .id(client.getId())
                .nomClient(client.getNomClient())
                .telephone(client.getTelephone())
                .soldeQuantite(client.getSoldeQuantite())
                .build();
    }

    private Client trouverClient(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Client introuvable avec l'identifiant : " + id));
    }

    // -------- CREATION --------

    @Override
    public ClientDto creerClient(ClientDto dto) {

        if (dto == null || dto.getNomClient() == null
                || dto.getNomClient().isBlank()) {
            throw new IllegalArgumentException("Le nom du client est obligatoire");
        }

        String nom = dto.getNomClient().trim();

        if (clientRepository.existsByNomClientIgnoreCase(nom)) {
            throw new IllegalArgumentException("Ce client existe déjà");
        }

        Client client = Client.builder()
                .nomClient(nom)
                .telephone(dto.getTelephone())
                .soldeQuantite(ZERO)
                .build();

        Client saved = clientRepository.save(client);
        log.info("Client créé : {}", saved.getNomClient());

        return convertirClient(saved);
    }

    // -------- LISTE --------

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public List<ClientDto> listerClients() {
        return clientRepository.findAll()
                .stream()
                .map(this::convertirClient)
                .toList();
    }

    // -------- RECHERCHE --------

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public ClientDto rechercherClient(Long id) {
        return convertirClient(trouverClient(id));
    }

    // -------- MODIFICATION --------

    @Override
    public ClientDto modifierClient(Long id, ClientDto dto) {

        if (dto == null || dto.getNomClient() == null
                || dto.getNomClient().isBlank()) {
            throw new IllegalArgumentException("Le nom du client est obligatoire");
        }

        Client client = trouverClient(id);
        String nom = dto.getNomClient().trim();

        clientRepository.findByNomClientIgnoreCase(nom).ifPresent(existant -> {
            if (!existant.getId().equals(id)) {
                throw new IllegalArgumentException("Ce nom est déjà utilisé");
            }
        });

        client.setNomClient(nom);
        client.setTelephone(dto.getTelephone());

        return convertirClient(clientRepository.save(client));
    }

    // -------- SUPPRESSION --------

    @Override
    public void supprimerClient(Long id) {

        Client client = trouverClient(id);

        if (livraisonRepository.existsByClient_Id(id)) {
            throw new IllegalArgumentException(
                    "Impossible de supprimer ce client : "
                            + "il possède un historique de livraisons");
        }

        clientRepository.delete(client);
        log.info("Client supprimé : {}", client.getNomClient());
    }

    @Override
    public Livraison enregistrerLivraison(LivraisonDto dto) {

        log.info("Enregistrement d'une livraison");

        // ============================================================
        // 1. VALIDATIONS — seuls client, date et quantité livrée sont obligatoires
        // ============================================================
        if (dto == null || dto.getClientId() == null) {
            throw new IllegalArgumentException("Veuillez sélectionner un client");
        }

        if (dto.getDateLivraison() == null) {
            throw new IllegalArgumentException("La date de livraison est obligatoire");
        }

        if (dto.getQuantiteLivree() == null
                || dto.getQuantiteLivree().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "La quantité livrée est obligatoire et ne peut pas être négative");
        }

        // ============================================================
        // 2. CHAMPS FACULTATIFS : null → ZERO
        // ============================================================
        BigDecimal quantiteLivree = dto.getQuantiteLivree();
        BigDecimal quantiteReglee = dto.getQuantiteReglee() != null
                ? dto.getQuantiteReglee() : BigDecimal.ZERO;
        BigDecimal prixUnitaire = dto.getPrixUnitaire() != null
                ? dto.getPrixUnitaire() : BigDecimal.ZERO;
        BigDecimal montantEncaisse = dto.getMontantEncaisse() != null
                ? dto.getMontantEncaisse() : BigDecimal.ZERO;

        // ============================================================
        // 3. AU MOINS UNE QUANTITÉ > 0 (livrée ou réglée)
        // ============================================================
        if (quantiteLivree.compareTo(BigDecimal.ZERO) == 0
                && quantiteReglee.compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalArgumentException(
                    "Saisissez au moins une quantité livrée ou un règlement");
        }

        if (quantiteReglee.compareTo(BigDecimal.ZERO) < 0
                || prixUnitaire.compareTo(BigDecimal.ZERO) < 0
                || montantEncaisse.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Les valeurs ne peuvent pas être négatives");
        }

        // ============================================================
        // 4. MODE DE PAIEMENT — obligatoire UNIQUEMENT si règlement
        // ============================================================
        boolean paiementEffectue =
                quantiteReglee.compareTo(BigDecimal.ZERO) > 0
                        || montantEncaisse.compareTo(BigDecimal.ZERO) > 0;

        if (paiementEffectue && dto.getModePaiement() == null) {
            throw new IllegalArgumentException(
                    "Veuillez préciser le mode de paiement (Liquide ou Dépôt)");
        }

        ModePaiement modePaiement = paiementEffectue ? dto.getModePaiement() : null;

        // ============================================================
        // 5. VERROU PESSIMISTE
        // ============================================================
        Client client = clientRepository.trouverClientAvecVerrou(dto.getClientId())
                .orElseThrow(() -> new IllegalArgumentException("Client introuvable"));

        // ============================================================
        // 6. CALCUL DU SOLDE — Solde = AncienSolde + Livré − Réglé
        // ============================================================
        BigDecimal ancienSolde = client.getSoldeQuantite();
        if (ancienSolde == null) ancienSolde = BigDecimal.ZERO;

        BigDecimal quantiteDisponible = ancienSolde.add(quantiteLivree);

        if (quantiteReglee.compareTo(quantiteDisponible) > 0) {
            throw new IllegalArgumentException(
                    "La quantité réglée (" + quantiteReglee
                            + ") dépasse la quantité disponible (" + quantiteDisponible + ")");
        }

        BigDecimal nouveauSolde = quantiteDisponible.subtract(quantiteReglee);

        // ============================================================
        // 7. MISE À JOUR CLIENT
        // ============================================================
        client.setSoldeQuantite(nouveauSolde);
        clientRepository.save(client);

        // ============================================================
        // 8. HISTORIQUE
        // ============================================================
        Livraison livraison = Livraison.builder()
                .client(client)
                .dateLivraison(dto.getDateLivraison())
                .quantiteLivree(quantiteLivree)
                .quantiteReglee(quantiteReglee)
                .prixUnitaire(prixUnitaire)
                .montantEncaisse(montantEncaisse)
                .modePaiement(modePaiement)
                .ancienSolde(ancienSolde)
                .nouveauSolde(nouveauSolde)
                .build();

        Livraison resultat = livraisonRepository.save(livraison);

        log.info(
                "Livraison enregistrée pour {} : ancien={}, nouveau={}, "
                        + "livré={}, réglé={}, mode={}",
                client.getNomClient(), ancienSolde, nouveauSolde,
                quantiteLivree, quantiteReglee,
                modePaiement != null ? modePaiement.name() : "AUCUN (crédit)");

        return resultat;
    }
    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public SituationClientDto consulterSituation(Long clientId) {

        Client client = trouverClient(clientId);

        BigDecimal solde = client.getSoldeQuantite();
        if (solde == null) solde = ZERO;

        return SituationClientDto.builder()
                .clientId(client.getId())
                .nomClient(client.getNomClient())
                .soldeQuantite(solde)
                .build();
    }

    // -------- HISTORIQUE --------

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public List<Livraison> historiqueClient(Long clientId) {

        trouverClient(clientId);

        return livraisonRepository
                .findByClient_IdOrderByDateLivraisonDescIdDesc(clientId);
    }






    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public DashboardDto getDashboard(LocalDate date) {

        LocalDate jour = (date != null) ? date : LocalDate.now();

        // Encaissements (déjà en place)
        BigDecimal montantJour    = livraisonRepository.sumMontantEncaisseByDate(jour);
        BigDecimal quantiteLivree = livraisonRepository.sumQuantiteLivreeByDate(jour);
        BigDecimal quantiteReglee = livraisonRepository.sumQuantiteRegleeByDate(jour);
        BigDecimal montantLiquide = livraisonRepository.sumMontantByDateAndMode(jour, ModePaiement.LIQUIDE);
        BigDecimal montantDepot   = livraisonRepository.sumMontantByDateAndMode(jour, ModePaiement.DEPOT);
        Long       nombreOps      = livraisonRepository.countByDate(jour);

        // ✅ NOUVEAU : dépenses
        BigDecimal montantDepense = depenseRepository.sumMontantByDate(jour);

        // ✅ NOUVEAU : répartition par catégorie
        Map<String, BigDecimal> depensesParCat = new LinkedHashMap<>();
        for (Object[] row : depenseRepository.sumByCategorieAndDate(jour)) {
            depensesParCat.put(((Enum<?>) row[0]).name(), (BigDecimal) row[1]);
        }

        // ✅ NOUVEAU : résultat net
        BigDecimal resultat = zero(montantJour).subtract(zero(montantDepense));

        return DashboardDto.builder()
                .date(jour)
                .montantEncaisseJour(zero(montantJour))
                .quantiteLivreeJour(zero(quantiteLivree))
                .quantiteRegleeJour(zero(quantiteReglee))
                .montantEncaisseLiquide(zero(montantLiquide))
                .montantEncaisseDepot(zero(montantDepot))
                .montantDepenseJour(zero(montantDepense))
                .depensesParCategorie(depensesParCat)
                .resultatNet(resultat)
                .nombreOperations(nombreOps != null ? nombreOps : 0L)
                .build();
    }

    private BigDecimal zero(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    // -------- DÉPENSES --------

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public List<DepenseDto> listerDepenses(LocalDate date) {
        List<Depense> depenses = (date != null)
                ? depenseRepository.findByDateDepenseOrderByIdDesc(date)
                : depenseRepository.findAll();
        return depenses.stream().map(this::toDto).toList();
    }

    @Override
    public DepenseDto creerDepense(DepenseDto dto) {
        validerDepense(dto);
        Depense depense = Depense.builder()
                .libelle(dto.getLibelle().trim())
                .categorie(dto.getCategorie())
                .montant(dto.getMontant())
                .dateDepense(dto.getDateDepense())
                .modePaiement(dto.getModePaiement())
                .description(dto.getDescription())
                .build();
        return toDto(depenseRepository.save(depense));
    }

    @Override
    public DepenseDto modifierDepense(Long id, DepenseDto dto) {
        validerDepense(dto);
        Depense depense = depenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dépense introuvable"));
        depense.setLibelle(dto.getLibelle().trim());
        depense.setCategorie(dto.getCategorie());
        depense.setMontant(dto.getMontant());
        depense.setDateDepense(dto.getDateDepense());
        depense.setModePaiement(dto.getModePaiement());
        depense.setDescription(dto.getDescription());
        return toDto(depenseRepository.save(depense));
    }

    @Override
    public void supprimerDepense(Long id) {
        if (!depenseRepository.existsById(id)) {
            throw new IllegalArgumentException("Dépense introuvable");
        }
        depenseRepository.deleteById(id);
    }

    private void validerDepense(DepenseDto dto) {
        if (dto == null
                || dto.getLibelle() == null || dto.getLibelle().isBlank()
                || dto.getCategorie() == null
                || dto.getMontant() == null
                || dto.getDateDepense() == null) {
            throw new IllegalArgumentException(
                    "Libellé, catégorie, montant et date sont obligatoires");
        }
        if (dto.getMontant().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Le montant doit être supérieur à zéro");
        }
    }

    private DepenseDto toDto(Depense d) {
        return DepenseDto.builder()
                .id(d.getId())
                .libelle(d.getLibelle())
                .categorie(d.getCategorie())
                .montant(d.getMontant())
                .dateDepense(d.getDateDepense())
                .modePaiement(d.getModePaiement())
                .description(d.getDescription())
                .build();
    }

    @Override
    @Transactional(Transactional.TxType.SUPPORTS)
    public RapportJourDto getRapportJour(LocalDate date) {

        LocalDate jour = (date != null) ? date : LocalDate.now();

        // 1. Toutes les livraisons du jour, regroupées par client
        Map<Long, BigDecimal[]> mvtParClient = new HashMap<>();
        for (Object[] row : livraisonRepository.sumParClientPourDate(jour)) {
            Long clientId          = (Long) row[0];
            BigDecimal livre       = toBig(row[1]);
            BigDecimal regle       = toBig(row[2]);
            mvtParClient.put(clientId, new BigDecimal[]{ livre, regle });
        }

        // 2. On récupère TOUS les clients (pour avoir le solde actuel)
        List<Client> clients = clientRepository.findAll();

        List<RapportJourDto.LigneRapport> lignes = new ArrayList<>();
        BigDecimal totalLivre = ZERO;
        BigDecimal totalRegle = ZERO;
        BigDecimal totalSolde = ZERO;

        for (Client c : clients) {
            BigDecimal[] mvt = mvtParClient.getOrDefault(
                    c.getId(), new BigDecimal[]{ ZERO, ZERO });
            BigDecimal livre = mvt[0];
            BigDecimal regle = mvt[1];
            BigDecimal solde = c.getSoldeQuantite() != null
                    ? c.getSoldeQuantite() : ZERO;

            // On garde la ligne si :
            //   - il y a eu un mouvement aujourd'hui, OU
            //   - le client a encore un solde > 0 à régler
            boolean mouvementJour = livre.compareTo(ZERO) > 0
                    || regle.compareTo(ZERO) > 0;
            boolean soldePositif  = solde.compareTo(ZERO) > 0;

            if (!mouvementJour && !soldePositif) continue;

            lignes.add(RapportJourDto.LigneRapport.builder()
                    .clientId(c.getId())
                    .nomClient(c.getNomClient())
                    .telephone(c.getTelephone())
                    .quantiteLivreeJour(livre)
                    .quantiteRegleeJour(regle)
                    .soldeActuel(solde)
                    .build());

            totalLivre = totalLivre.add(livre);
            totalRegle = totalRegle.add(regle);
            totalSolde = totalSolde.add(solde);
        }

        // Tri : solde décroissant (les plus gros débiteurs d'abord)
        lignes.sort((a, b) -> b.getSoldeActuel().compareTo(a.getSoldeActuel()));

        return RapportJourDto.builder()
                .date(jour)
                .lignes(lignes)
                .totalLivreJour(totalLivre)
                .totalRegleJour(totalRegle)
                .totalSoldeGlobal(totalSolde)
                .build();
    }

    private BigDecimal toBig(Object o) {
        if (o == null) return ZERO;
        if (o instanceof BigDecimal bd) return bd;
        return new BigDecimal(o.toString());
    }
}