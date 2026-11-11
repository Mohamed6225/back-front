package garba.demo.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardDto {

    private LocalDate date;

    // Encaissements
    private BigDecimal montantEncaisseJour;
    private BigDecimal quantiteLivreeJour;
    private BigDecimal quantiteRegleeJour;
    private BigDecimal montantEncaisseLiquide;
    private BigDecimal montantEncaisseDepot;

    // ✅ NOUVEAU : dépenses
    private BigDecimal montantDepenseJour;
    private Map<String, BigDecimal> depensesParCategorie;

    // ✅ NOUVEAU : résultat
    private BigDecimal resultatNet;

    private Long nombreOperations;
}