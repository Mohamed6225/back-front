package garba.demo.dto;

import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientDto {
    private Long id;
    private String nomClient;
    private String telephone;
    private BigDecimal soldeQuantite;   // ← ajout
}