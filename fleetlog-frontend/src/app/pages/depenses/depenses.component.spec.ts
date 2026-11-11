import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Depenses } from './depenses.component';

describe('Depenses', () => {
  let component: Depenses;
  let fixture: ComponentFixture<Depenses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Depenses],
    }).compileComponents();

    fixture = TestBed.createComponent(Depenses);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
