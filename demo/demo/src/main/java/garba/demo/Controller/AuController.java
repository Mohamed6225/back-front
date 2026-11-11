package garba.demo.Controller;

import garba.demo.Service.AutoService;
import garba.demo.domaine.Livraison;
import garba.demo.dto.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/auto")
@CrossOrigin(origins = "http://localhost:4200")
public class AuController {

    private final AutoService autoService;

    // =========================================
    // CLIENTS
    // =========================================

    @PostMapping("/clients")
    public ClientDto creerClient(@RequestBody ClientDto dto) {

        return autoService.creerClient(dto);
    }

    @GetMapping("/clients")
    public List<ClientDto> listerClients() {

        return autoService.listerClients();
    }

    @GetMapping("/clients/{id}")
    public ClientDto rechercherClient(@PathVariable Long id) {

        return autoService.rechercherClient(id);
    }

    @PutMapping("/clients/{id}")
    public ClientDto modifierClient(
            @PathVariable Long id,
            @RequestBody ClientDto dto) {

        return autoService.modifierClient(id, dto);
    }

    @DeleteMapping("/clients/{id}")
    public String supprimerClient(@PathVariable Long id) {

        autoService.supprimerClient(id);

        return "Client supprimé avec succès";
    }

    // =========================================
    // LIVRAISONS
    // =========================================

    @PostMapping("/livraisons")
    public Livraison enregistrerLivraison(
            @RequestBody LivraisonDto dto) {

        return autoService.enregistrerLivraison(dto);
    }

    // =========================================
    // SITUATION DU CLIENT
    // =========================================

    @GetMapping("/clients/{id}/situation")
    public SituationClientDto consulterSituation(
            @PathVariable Long id) {

        return autoService.consulterSituation(id);
    }

    // =========================================
    // HISTORIQUE
    // =========================================

    @GetMapping("/clients/{id}/historique")
    public List<Livraison> historiqueClient(
            @PathVariable Long id) {

        return autoService.historiqueClient(id);
    }



    @GetMapping("/dashboard")
    public DashboardDto dashboard(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        return autoService.getDashboard(date);
    }

    // =================================
// DÉPENSES
// =================================

    @GetMapping("/depenses")
    public List<DepenseDto> listerDepenses(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {
        return autoService.listerDepenses(date);
    }

    @PostMapping("/depenses")
    public DepenseDto creerDepense(@RequestBody DepenseDto dto) {
        return autoService.creerDepense(dto);
    }

    @PutMapping("/depenses/{id}")
    public DepenseDto modifierDepense(@PathVariable Long id,
                                      @RequestBody DepenseDto dto) {
        return autoService.modifierDepense(id, dto);
    }

    @DeleteMapping("/depenses/{id}")
    public String supprimerDepense(@PathVariable Long id) {
        autoService.supprimerDepense(id);
        return "Dépense supprimée";
    }
    @GetMapping("/rapport-du-jour")
    public RapportJourDto getRapportJour(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return autoService.getRapportJour(date);
    }
}