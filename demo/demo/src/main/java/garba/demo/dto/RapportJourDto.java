package garba.demo.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RapportJourDto {

    private LocalDate date;

    // Lignes du rapport
    private List<LigneRapport> lignes;

    // Totaux
    private BigDecimal totalLivreJour;
    private BigDecimal totalRegleJour;
    private BigDecimal totalSoldeGlobal;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LigneRapport {
        private Long clientId;
        private String nomClient;
        private String telephone;

        private BigDecimal quantiteLivreeJour;   // somme du jour
        private BigDecimal quantiteRegleeJour;   // somme du jour
        private BigDecimal soldeActuel;          // solde cumulé actuel
    }
}