import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DataPoint } from '../matrix-chart';
import { environment } from '../../environments/environment.local';

@Injectable({
  providedIn: 'root'
})
export class DeepIndexService {
  private http = inject(HttpClient);

  
  // Change this for live

  // private nasaApiKey = 'DEMO_KEY';
  private nasaApiKey = environment.nasaApiKey;

  async fetchDashboardData(): Promise<DataPoint[]> {
  try {
    console.log("1. Initiating Matrix data sequence...");
    
    const ghResponse = await firstValueFrom(
      this.http.get<any[]>('https://api.github.com/users/vvagraphics/events/public')
    );
    
    console.log("2. Raw GitHub Events:", ghResponse); // See what GitHub actually sent

    const commitsByDate: Record<string, number> = {};
    ghResponse.forEach(event => {
      if (event.type === 'PushEvent') {
        const date = event.created_at.split('T')[0]; 
        const commitCount = event.payload.commits ? event.payload.commits.length : 0;
        commitsByDate[date] = (commitsByDate[date] || 0) + commitCount;
      }
    });

    const dates = Object.keys(commitsByDate).sort();
    console.log("3. Dates with Public Commits:", dates); // Is this array empty?

    if (dates.length === 0) {
      console.warn("SYSTEM ALERT: No public commits found in the last 90 days.");
      if (dates.length === 0) {
     
        // Ghost Data
        console.warn("SYSTEM ALERT: No public commits found. Booting simulation mode...");
      return this.generateMockData(); 
    }
      return []; 
      
    }

    

      const startDate = dates[0];
      const endDate = dates[dates.length - 1];

      // 3. Fetch NASA Space Weather (GST) for that same date range
      const nasaUrl = `https://api.nasa.gov/DONKI/GST?startDate=${startDate}&endDate=${endDate}&api_key=${this.nasaApiKey}`;
      
      let spaceWeather: any[] = [];
      try {
         spaceWeather = await firstValueFrom(this.http.get<any[]>(nasaUrl)) || [];
      } catch (e) {
         console.warn("NASA API limit or no storms found for this window. Defaulting to calm weather.");
      }

      // 4. Merge the Data and Calculate Efficiency!
      const finalData: DataPoint[] = dates.map(date => {
        const commits = commitsByDate[date];
        
        // Check if there was a solar storm on this day
        const storm = spaceWeather.find(s => s.startTime.startsWith(date));
        
        // Base efficiency on commits (mock formula)
        let baseScore = Math.min((commits / 10) * 100, 100); 

        // Apply "The Matrix" Space Weather Modifier
        if (storm) {
            // Find the highest Kp index for the storm
            const maxKp = Math.max(...storm.allKpIndex.map((k: any) => k.kpIndex));
            
            // If you coded a lot during a severe solar storm (Kp > 5), 
            // you get a massive efficiency boost!
            if (maxKp > 5 && commits > 5) {
                baseScore = Math.min(baseScore + 25, 100); 
            } else if (maxKp > 5 && commits <= 2) {
                // The storm drained your energy
                baseScore = Math.max(baseScore - 20, 10);
            }
        }

        return {
          date: date,
          commits: commits,
          efficiencyScore: Math.round(baseScore)
        };
      });

      return finalData;

    } catch (error) {
      console.error("Matrix Engine Failure: Could not fetch data stream.", error);
      return [];
    }
  }

  // Generates 14 days of cool looking mock data to test the UI
  private generateMockData(): DataPoint[] {
    const mockData: DataPoint[] = [];
    const today = new Date();
    
    for (let i = 14; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      mockData.push({
        date: d.toISOString().split('T')[0],
        // Random commits between 0 and 15
        commits: Math.floor(Math.random() * 15), 
        // Random efficiency between 40 and 100
        efficiencyScore: Math.floor(Math.random() * (100 - 40 + 1) + 40) 
      });
    }
    return mockData;
  }
}