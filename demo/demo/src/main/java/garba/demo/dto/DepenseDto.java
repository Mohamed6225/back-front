package garba.demo.dto;

import garba.demo.domaine.CategorieDepense;
import garba.demo.domaine.ModePaiement;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DepenseDto {
    private Long id;
    private String libelle;
    private CategorieDepense categorie;
    private BigDecimal montant;
    private LocalDate dateDepense;
    private ModePaiement modePaiement;
    private String description;
}