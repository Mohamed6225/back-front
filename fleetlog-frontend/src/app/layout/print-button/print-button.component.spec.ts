import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrintButton } from './print-button.component';

describe('PrintButton', () => {
  let component: PrintButton;
  let fixture: ComponentFixture<PrintButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintButton],
    }).compileComponents();

    fixture = TestBed.createComponent(PrintButton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
