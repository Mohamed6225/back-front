package garba.demo.Repository;

import garba.demo.domaine.Livraison;
import garba.demo.domaine.ModePaiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface LivraisonRepository extends JpaRepository<Livraison, Long> {

    boolean existsByClient_Id(Long clientId);

    List<Livraison> findByClient_IdOrderByDateLivraisonDescIdDesc(Long clientId);

    // ============================================
    // TOTAUX JOURNALIERS (déjà présents)
    // ============================================

    @Query("""
        SELECT COALESCE(SUM(l.montantEncaisse), 0)
        FROM Livraison l
        WHERE l.dateLivraison = :date
    """)
    BigDecimal sumMontantEncaisseByDate(@Param("date") LocalDate date);

    @Query("""
        SELECT COALESCE(SUM(l.quantiteLivree), 0)
        FROM Livraison l
        WHERE l.dateLivraison = :date
    """)
    BigDecimal sumQuantiteLivreeByDate(@Param("date") LocalDate date);

    @Query("""
        SELECT COALESCE(SUM(l.quantiteReglee), 0)
        FROM Livraison l
        WHERE l.dateLivraison = :date
    """)
    BigDecimal sumQuantiteRegleeByDate(@Param("date") LocalDate date);

    @Query("""
        SELECT COALESCE(SUM(l.montantEncaisse), 0)
        FROM Livraison l
        WHERE l.dateLivraison = :date
          AND l.modePaiement = :mode
    """)
    BigDecimal sumMontantByDateAndMode(
            @Param("date") LocalDate date,
            @Param("mode") ModePaiement mode);

    @Query("""
        SELECT COUNT(l)
        FROM Livraison l
        WHERE l.dateLivraison = :date
    """)
    Long countByDate(@Param("date") LocalDate date);

    // ============================================
    // ✅ NOUVEAU : regroupement par client pour une date
    //    Retourne : Object[]{ clientId (Long), totalLivré (BigDecimal), totalRéglé (BigDecimal) }
    // ============================================

    @Query("""
        SELECT l.client.id,
               COALESCE(SUM(l.quantiteLivree), 0),
               COALESCE(SUM(l.quantiteReglee), 0)
        FROM Livraison l
        WHERE l.dateLivraison = :date
        GROUP BY l.client.id
    """)
    List<Object[]> sumParClientPourDate(@Param("date") LocalDate date);
}