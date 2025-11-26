package smartcashpower.app.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "meters")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Meter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meter_id")
    private Long id;

    @Column(name = "meter_number", nullable = false, unique = true)
    private String meterNumber;

    @Column(name = "current_units", nullable = false)
    private Float currentUnits = 0.0f;

    @Column(name = "used_units", nullable = false)
    private Float usedUnits = 0.0f;

    @Column(nullable = false)
    private Boolean active = true;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}

