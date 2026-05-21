import { Component, computed, input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DataPoint {
  date: string;
  commits: number;
  efficiencyScore: number;
}

@Component({
  selector: 'app-matrix-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './matrix-chart.html',
  styleUrl: './matrix-chart.scss'
})
export class MatrixChartComponent {
  data = input<DataPoint[]>([]);

  width = 800;
  height = 400;
  padding = 40;

  hoverX = signal<number | null>(null);
  activePoint = signal<DataPoint | null>(null);
  mouseX = signal<number>(0);
  mouseY = signal<number>(0);

  timeSliderValue = signal<number>(0);
  
  maxCommits = computed(() => {
    const commits = this.data().map(d => d.commits);
    return commits.length ? Math.max(1, ...commits) : 1; 
  });

  maxEfficiency = computed(() => {
    const scores = this.data().map(d => d.efficiencyScore);
    return scores.length ? Math.max(1, ...scores) : 1; 
  });

  mappedPoints = computed(() => {
    const dataset = this.data();
    if (dataset.length === 0) return [];

    const xStep = (this.width - this.padding * 2) / (dataset.length - 1 || 1);

    return dataset.map((point, index) => ({
      ...point,
      cx: this.padding + (index * xStep),
      cyCommits: this.height - this.padding - ((point.commits / this.maxCommits()) * (this.height - this.padding * 2)),
      cyEfficiency: this.height - this.padding - ((point.efficiencyScore / this.maxEfficiency()) * (this.height - this.padding * 2))
    }));
  });

  commitsPath = computed(() => this.generateSmoothPath(this.mappedPoints().map(p => ({ x: p.cx, y: p.cyCommits }))));
  efficiencyPath = computed(() => this.generateSmoothPath(this.mappedPoints().map(p => ({ x: p.cx, y: p.cyEfficiency }))));

  currentTheme = computed(() => {
    const point = this.activePoint();
    if (!point) return 'theme-neutral';
    
    // Adjust these thresholds based on how your mock data looks!
    if (point.efficiencyScore >= 75) return 'theme-neon-gold'; 
    if (point.efficiencyScore <= 45) return 'theme-dark-rain'; 
    return 'theme-neutral';
  });

  // Listen to slider changes and update the active point programmatically
  onSliderChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const index = parseInt(input.value, 10);
    this.timeSliderValue.set(index);

    const points = this.mappedPoints();
    if (points && points[index]) {
      const selected = points[index];
      // Move the vertical line and update the tooltip data
      this.hoverX.set(selected.cx);
      this.activePoint.set({ 
        date: selected.date, 
        commits: selected.commits, 
        efficiencyScore: selected.efficiencyScore 
      });
      
      // Map SVG viewBox coordinates to actual DOM container width/height
      const container = document.querySelector('.matrix-chart-container');
      const containerWidth = container ? container.clientWidth : this.width;
      const containerHeight = container ? container.clientHeight : this.height;

      this.mouseX.set((selected.cx / this.width) * containerWidth);
      this.mouseY.set(containerHeight / 2);
    }
  }

  // Generates Cubic Bezier curve string for smooth SVG lines
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

  onMouseMove(event: MouseEvent) {
    const svgElement = event.currentTarget as SVGSVGElement;
    
    // Calculate exact coordinates relative to the chart container
    const container = svgElement.closest('.matrix-chart-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      let calculatedX = event.clientX - rect.left;
      
      // Check if tooltip is too close to the right edge (prevent mobile overflow)
      if (calculatedX + 170 > rect.width) {
        calculatedX -= 160; // Flip it to the left of the cursor
      } else {
        calculatedX += 20;  // Standard right offset
      }

      this.mouseX.set(calculatedX);
      this.mouseY.set(event.clientY - rect.top);
    }

    const pt = svgElement.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    
    const svgP = pt.matrixTransform(svgElement.getScreenCTM()?.inverse());

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

  // THIS FUNCTION WAS MISSING/MISPLACED
  onMouseLeave() {
    this.hoverX.set(null);
    this.activePoint.set(null);
  }
}