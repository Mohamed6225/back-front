package garba.demo.Repository;

import garba.demo.domaine.Depense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface DepenseRepository extends JpaRepository<Depense, Long> {

    List<Depense> findByDateDepenseOrderByIdDesc(LocalDate date);

    @Query("""
        SELECT COALESCE(SUM(d.montant), 0)
        FROM Depense d
        WHERE d.dateDepense = :date
    """)
    BigDecimal sumMontantByDate(@Param("date") LocalDate date);

    @Query("""
        SELECT d.categorie, COALESCE(SUM(d.montant), 0)
        FROM Depense d
        WHERE d.dateDepense = :date
        GROUP BY d.categorie
    """)
    List<Object[]> sumByCategorieAndDate(@Param("date") LocalDate date);
}