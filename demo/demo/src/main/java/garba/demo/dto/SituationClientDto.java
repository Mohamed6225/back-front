package garba.demo.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SituationClientDto {

    private Long clientId;
    private String nomClient;
    private BigDecimal soldeQuantite;
}