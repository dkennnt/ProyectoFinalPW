import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatDiagram } from './seat-diagram';

describe('SeatDiagram', () => {
  let component: SeatDiagram;
  let fixture: ComponentFixture<SeatDiagram>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatDiagram]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatDiagram);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
