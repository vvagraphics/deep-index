import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatrixChart } from './matrix-chart';

describe('MatrixChart', () => {
  let component: MatrixChart;
  let fixture: ComponentFixture<MatrixChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatrixChart],
    }).compileComponents();

    fixture = TestBed.createComponent(MatrixChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
