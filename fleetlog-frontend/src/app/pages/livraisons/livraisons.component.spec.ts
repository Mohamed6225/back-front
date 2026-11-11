import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Livraisons } from './livraisons.component';

describe('Livraisons', () => {
  let component: Livraisons;
  let fixture: ComponentFixture<Livraisons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Livraisons],
    }).compileComponents();

    fixture = TestBed.createComponent(Livraisons);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
