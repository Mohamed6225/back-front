package garba.demo.domaine;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "clients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom_client", nullable = false, unique = true)
    private String nomClient;

    private String telephone;

    @Builder.Default
    @Column(name = "solde_quantite", nullable = false,
            precision = 12, scale = 2)
    private BigDecimal soldeQuantite = BigDecimal.ZERO;
}