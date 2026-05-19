// --- TYPES & INTERFACES ---
import { Component, computed, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DataPoint {
  date: string;
  commits: number;
  efficiencyScore: number;
}

// --- COMPONENT CONFIG & DECORATORS ---
@Component({
  selector: 'app-matrix-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './matrix-chart.html'
})
export class MatrixChartComponent {
  // --- STATE, SIGNALS & INITIALIZATION ---
  data = input<DataPoint[]>([]);

  width = 800;
  height = 400;
  padding = 40;

  hoverX = signal<number | null>(null);
  activePoint = signal<DataPoint | null>(null);
  mouseX = signal<number>(0);
  mouseY = signal<number>(0);

  maxCommits = computed(() => Math.max(...this.data().map(d => d.commits), 1));
  maxEfficiency = computed(() => Math.max(...this.data().map(d => d.efficiencyScore), 1));

  mappedPoints = computed(() => {
    const dataset = this.data();
    if (dataset.length === 0) return [];

    const xStep = (this.width - this.padding * 2) / (dataset.length - 1 || 1);

    return dataset.map((point, index) => {
      return {
        ...point,
        cx: this.padding + (index * xStep),
        cyCommits: this.height - this.padding - ((point.commits / this.maxCommits()) * (this.height - this.padding * 2)),
        cyEfficiency: this.height - this.padding - ((point.efficiencyScore / this.maxEfficiency()) * (this.height - this.padding * 2))
      };
    });
  });

  commitsPath = computed(() => this.generateSmoothPath(this.mappedPoints().map(p => ({ x: p.cx, y: p.cyCommits }))));
  efficiencyPath = computed(() => this.generateSmoothPath(this.mappedPoints().map(p => ({ x: p.cx, y: p.cyEfficiency }))));

  // --- NATIVE API INTEGRATION LOOP ---
  private generateSmoothPath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const cpX = (current.x + next.x) / 2;
      path += ` C ${cpX} ${current.y}, ${cpX} ${next.y}, ${next.x} ${next.y}`;
    }
    return path;
  }

  // --- EVENT HANDLERS & VALIDATION ---
  onMouseMove(event: MouseEvent) {
    const svgElement = event.currentTarget as SVGSVGElement;
    const pt = svgElement.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    
    const svgP = pt.matrixTransform(svgElement.getScreenCTM()?.inverse());

    this.mouseX.set(event.clientX);
    this.mouseY.set(event.clientY);

    const points = this.mappedPoints();
    if (points.length === 0) return;

    let closest = points[0];
    let minDiff = Math.abs(svgP.x - closest.cx);

    for (const p of points) {
      const diff = Math.abs(svgP.x - p.cx);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    }

    this.hoverX.set(closest.cx);
    this.activePoint.set({ date: closest.date, commits: closest.commits, efficiencyScore: closest.efficiencyScore });
  }

  onMouseLeave() {
    this.hoverX.set(null);
    this.activePoint.set(null);
  }
}