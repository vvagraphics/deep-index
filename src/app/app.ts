import { Component, inject, signal, OnInit } from '@angular/core';
import { MatrixChartComponent, DataPoint } from './matrix-chart';
import { DeepIndexService } from './services/deep-index.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatrixChartComponent],
  template: `
    <div style="padding: 50px;">
      <h1 style="color: #00f2fe; font-family: monospace;">DeepIndex // Neural Link Active</h1>
      <app-matrix-chart [data]="liveData()"></app-matrix-chart>
    </div>
  `
})
export class AppComponent implements OnInit {
  dataService = inject(DeepIndexService);
  liveData = signal<DataPoint[]>([]);

  async ngOnInit() {
    // Fetch live data on load and update the signal!
    const data = await this.dataService.fetchDashboardData();
    this.liveData.set(data);
  }
}