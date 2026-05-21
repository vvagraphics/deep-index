import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatrixChartComponent, DataPoint } from './matrix-chart';
import { DeepIndexService } from './services/deep-index.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatrixChartComponent, CommonModule, FormsModule],
  template: `
    <div class="avatar-ghost" 
         *ngIf="userProfile()" 
         [style.backgroundImage]="'url(' + userProfile().avatar_url + ')'"
         [style.opacity]="(powerLevel() / 100) * 0.15 + 0.05"> </div>

    <div class="dashboard-wrapper">
      
      <header class="solar-header">
        <div class="title-container">
            <img *ngIf="userProfile()" [src]="userProfile().avatar_url" class="mini-avatar" alt="profile">
            <h1>DeepIndex // Solar Core</h1>
        </div>
        
        <div class="power-meter-container" *ngIf="liveData().length > 0">
            <div class="power-label">OVERALL SOLAR ENERGY: <span>{{ powerLevel() }}%</span></div>
            <div class="power-track">
                <div class="power-fill" [style.width]="powerLevel() + '%'"></div>
            </div>
        </div>
      </header>

      <div class="system-goal-panel">
        <p class="app-description">
          <strong>SYSTEM GOAL:</strong> DeepIndex correlates raw developer output (GitHub commits) against localized environmental telemetry and Solar Geomagnetic Storm data to predict optimal coding efficiency cycles.
        </p>
      </div>

      <div class="search-console">
        <label for="github-input" class="input-label">Target GitHub Username:</label>
        
        <div class="input-group">
          <input 
            id="github-input"
            type="text" 
            [(ngModel)]="searchInput" 
            placeholder="e.g. torvalds (type your GitHub name here)..."
            (keyup.enter)="runScan(searchInput())"
          >
          <button (click)="runScan(searchInput())" [disabled]="isLoading()">
            {{ isLoading() ? 'SCANNING SECTOR...' : 'INITIATE SCAN' }}
          </button>
        </div>

        <div class="preset-users">
          <span>Test a legendary coder:</span>
          <button *ngFor="let p of presets" (click)="runScan(p)">{{ p }}</button>
        </div>

        <div *ngIf="errorMessage()" class="error-msg">
          {{ errorMessage() }}
        </div>
      </div>

      <app-matrix-chart *ngIf="liveData().length > 0" [data]="liveData()"></app-matrix-chart>
    </div>
  `,
  styles: [`
    /* --- PREVENT MOBILE OVERFLOW --- */
    .dashboard-wrapper, .dashboard-wrapper * {
      box-sizing: border-box;
    }

    /* --- THE FIRE AVATAR BACKGROUND --- */
    .avatar-ghost {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background-size: cover;
      background-position: center;
      z-index: -1;
      pointer-events: none;
      filter: grayscale(100%) sepia(100%) hue-rotate(350deg) saturate(600%) blur(15px);
      transition: opacity 1s ease-in-out;
    }

    /* --- LAYOUT & STYLES --- */
    .dashboard-wrapper {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      font-family: 'Courier New', Courier, monospace;
      color: #e2e8f0;
      position: relative;
      z-index: 1;
      overflow-x: hidden; /* Prevents horizontal scroll clipping */
    }

    .solar-header {
      margin-bottom: 20px;
      background: rgba(10, 5, 0, 0.7);
      padding: 20px;
      border-radius: 12px;
      border-bottom: 2px solid #ff4400;
      box-shadow: 0 10px 30px rgba(255, 68, 0, 0.2);
    }

    .title-container {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .mini-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: 2px solid #ffaa00;
      box-shadow: 0 0 15px #ffaa00;
      flex-shrink: 0;
    }

    .solar-header h1 {
      color: #ffaa00;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin: 0;
      text-shadow: 0 0 20px rgba(255, 170, 0, 0.8);
      font-size: 1.8rem;
    }

    /* --- DYNAMIC POWER METER --- */
    .power-meter-container {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid rgba(255, 170, 0, 0.2);
    }
    .power-label {
      font-size: 0.85rem;
      color: #ffaa00;
      margin-bottom: 5px;
      font-weight: bold;
      letter-spacing: 1px;
    }
    .power-label span { color: #fff; }
    
    .power-track {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .power-fill {
      height: 100%;
      background: linear-gradient(90deg, #ff4400, #ffea00);
      box-shadow: 0 0 15px #ffea00;
      border-radius: 4px;
      transition: width 1.5s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    /* --- SYSTEM GOAL PANEL (Now separated) --- */
    .system-goal-panel {
      margin-bottom: 30px;
    }
    .app-description {
      background: rgba(20, 10, 0, 0.8);
      border: 1px solid rgba(255, 170, 0, 0.3);
      border-left: 4px solid #ffaa00;
      padding: 15px 20px;
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.6;
      border-radius: 4px;
      color: #cbd5e1;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
    .app-description strong {
      color: #ffea00;
      letter-spacing: 1px;
    }
    
    /* --- CONTROLS --- */
    .search-console {
      background: rgba(20, 10, 0, 0.8);
      border: 1px solid rgba(255, 100, 0, 0.3);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      backdrop-filter: blur(10px);
    }
    .input-label {
      display: block;
      margin-bottom: 10px;
      color: #ffaa00;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 0.85rem;
    }
    .input-group {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      width: 100%;
    }
    input {
      flex: 1;
      width: 100%;
      padding: 12px;
      background: rgba(0,0,0,0.5);
      border: 1px solid #ffaa00;
      color: white;
      border-radius: 4px;
      font-family: inherit;
      outline: none;
    }
    input:focus {
      box-shadow: 0 0 10px rgba(255, 170, 0, 0.5);
    }
    button {
      padding: 12px 24px;
      background: #ff5500;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s;
      text-transform: uppercase;
      white-space: nowrap; /* Prevents button text from breaking awkwardly */
    }
    button:hover:not([disabled]) {
      background: #ffaa00;
      box-shadow: 0 0 15px #ffaa00;
    }
    .preset-users {
      display: flex;
      gap: 10px;
      font-size: 0.8rem;
      align-items: center;
      color: #94a3b8;
      flex-wrap: wrap; /* Allows buttons to wrap on smaller screens */
    }
    .preset-users button {
      padding: 6px 12px;
      background: rgba(255, 85, 0, 0.1);
      border: 1px solid rgba(255, 170, 0, 0.3);
      font-size: 0.75rem;
    }
    .preset-users button:hover {
      border-color: #ffaa00;
      background: rgba(255, 170, 0, 0.2);
    }
    .error-msg {
      margin-top: 15px;
      color: #ff3333;
      background: rgba(255,0,0,0.1);
      padding: 10px;
      border-left: 3px solid #ff3333;
    }

    /* --- MOBILE RESPONSIVENESS REFINED --- */
    @media (max-width: 600px) {
      .dashboard-wrapper {
        padding: 15px 10px; /* Reduced outer padding for more screen space */
      }
      .title-container {
        flex-direction: column;
        text-align: center;
        gap: 10px;
      }
      .solar-header h1 {
        font-size: 1.3rem;
      }
      .input-group {
        flex-direction: column;
      }
      button {
        width: 100%;
        padding: 15px; /* Larger tap target */
      }
      .preset-users {
        justify-content: center;
      }
      .app-description {
        font-size: 0.85rem;
        padding: 12px;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  dataService = inject(DeepIndexService);
  
  liveData = signal<DataPoint[]>([]);
  searchInput = signal<string>('vvagraphics'); 
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  
  userProfile = signal<any>(null);
  powerLevel = signal<number>(0);

  presets = ['torvalds', 'yyx990803', 'gaearon', 'sindresorhus'];

  ngOnInit() {
    this.runScan('vvagraphics'); 
  }

  async runScan(username: string) {
    if (!username.trim()) return;
    
    // Clean username in case they pasted a URL
    const cleanUsername = username.replace('https://github.com/', '').replace('/', '').trim();

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.searchInput.set(cleanUsername); 

    try {
      // 1. Fetch the user's avatar and profile from GitHub directly
      const profileRes = await fetch(`https://api.github.com/users/${cleanUsername}`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        this.userProfile.set(profileData);
      }

      // 2. Fetch the Matrix Chart data
      const data = await this.dataService.fetchDashboardData(cleanUsername);
      this.liveData.set(data);

      // 3. Calculate "Solar Power Level" (Average Efficiency) to drive the UI
      if (data.length > 0) {
        const total = data.reduce((sum, point) => sum + point.efficiencyScore, 0);
        const average = Math.round(total / data.length);
        this.powerLevel.set(average);
      } else {
        this.powerLevel.set(0);
      }

    } catch (err) {
      this.liveData.set([]);
      this.userProfile.set(null);
      this.powerLevel.set(0);
      this.errorMessage.set(`Could not analyze ${cleanUsername}. They may not exist or the API limit was hit.`);
    } finally {
      this.isLoading.set(false);
    }
  }
}