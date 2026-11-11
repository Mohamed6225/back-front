package garba.demo.Repository;

import garba.demo.domaine.Client;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {

    boolean existsByNomClientIgnoreCase(String nom);

    Optional<Client> findByNomClientIgnoreCase(String nom);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Client c where c.id = :id")
    Optional<Client> trouverClientAvecVerrou(@Param("id") Long id);
}