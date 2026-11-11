import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Rapports } from './rapports.component';

describe('Rapports', () => {
  let component: Rapports;
  let fixture: ComponentFixture<Rapports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rapports],
    }).compileComponents();

    fixture = TestBed.createComponent(Rapports);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
