import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Releve } from './releve.component';

describe('Releve', () => {
  let component: Releve;
  let fixture: ComponentFixture<Releve>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Releve],
    }).compileComponents();

    fixture = TestBed.createComponent(Releve);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
