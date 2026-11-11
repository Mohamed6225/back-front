package garba.demo.domaine;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "livraisons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Livraison {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(nullable = false)
    private LocalDate dateLivraison;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantiteLivree;

    @Builder.Default
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantiteReglee = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal prixUnitaire = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_paiement", length = 20)
    private ModePaiement modePaiement;

    @Builder.Default
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal montantEncaisse = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal ancienSolde;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal nouveauSolde;
}