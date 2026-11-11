package garba.demo.dto;

import garba.demo.domaine.ModePaiement;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class LivraisonDto {
    private  Long clientId;
    private  LocalDate dateLivraison;
    private  BigDecimal quantiteLivree;
    private  BigDecimal quantiteReglee;
    private  BigDecimal prixUnitaire;
    private  BigDecimal montantEncaisse;
    private ModePaiement modePaiement;
}
