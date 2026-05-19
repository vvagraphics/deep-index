// --- TYPES & INTERFACES ---
import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatrixChartComponent, DataPoint } from './matrix-chart';

interface SystemLog extends DataPoint {
  weather: string;
  geomagneticStorm: boolean;
}

// --- COMPONENT CONFIG & DECORATORS ---
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MatrixChartComponent],
  templateUrl: './app.html'
})
export class App {
  // --- STATE, SIGNALS & INITIALIZATION ---
  historicalLogs = signal<SystemLog[]>([
    { date: '2026-05-12', commits: 5, efficiencyScore: 45, weather: 'Thunderstorm', geomagneticStorm: true },
    { date: '2026-05-13', commits: 18, efficiencyScore: 92, weather: 'Clear Sky', geomagneticStorm: false },
    { date: '2026-05-14', commits: 22, efficiencyScore: 96, weather: 'Clear Sky', geomagneticStorm: false },
    { date: '2026-05-15', commits: 8, efficiencyScore: 60, weather: 'Heavy Rain', geomagneticStorm: false },
    { date: '2026-05-16', commits: 2, efficiencyScore: 30, weather: 'Solar Flare Active', geomagneticStorm: true },
    { date: '2026-05-17', commits: 14, efficiencyScore: 78, weather: 'Overcast', geomagneticStorm: false },
    { date: '2026-05-18', commits: 29, efficiencyScore: 99, weather: 'Clear Sky', geomagneticStorm: false }
  ]);

  timeIndex = signal<number>(6); // Default to latest day index

  activeLog = computed(() => this.historicalLogs()[this.timeIndex()]);

  // Reactive Matrix Engine Flair Theme: High productivity glows gold, poor conditions triggers stormy matrix theme
  currentTheme = computed(() => {
    const log = this.activeLog();
    if (!log) return 'rainy';
    return log.efficiencyScore >= 85 ? 'neon-gold' : 'dark-rainy';
  });

  // Dynamic sliced window passing to matrix chart up to selected time machine mark
  chartDataWindow = computed(() => {
    return this.historicalLogs().slice(0, this.timeIndex() + 1);
  });

  // --- EVENT HANDLERS & VALIDATION ---
  onTimeSliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.timeIndex.set(parseInt(target.value, 10));
  }
}