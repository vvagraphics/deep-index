import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js'; // <-- NEW
import { DataPoint } from '../matrix-chart'; 
import { environment } from '../../environments/environment.local';

@Injectable({
  providedIn: 'root'
})
export class DeepIndexService {
  private http = inject(HttpClient);
  private nasaApiKey = environment.nasaApiKey; 
  
  // Initialize the Supabase Client
  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl, 
    environment.supabaseKey
  );

  async fetchDashboardData(): Promise<DataPoint[]> {
    try {
      console.log("1. Connecting to Matrix Mainframe (Supabase)...");
      
      // Step A: Try to get all historical data from Supabase
      const { data: dbData, error } = await this.supabase
        .from('daily_efficiency')
        .select('date, commits, efficiency_score')
        .order('date', { ascending: true });

      if (error) throw error;

      // Format Supabase data to match our chart
      let historicalData: DataPoint[] = (dbData || []).map(row => ({
        date: row.date,
        commits: row.commits,
        efficiencyScore: row.efficiency_score
      }));

      // Step B: Check if we need to sync today's data
      const today = new Date().toISOString().split('T')[0];
      const hasSyncedToday = historicalData.some(d => d.date === today);

      if (hasSyncedToday) {
        console.log("2. Database is up to date. Loading historical data.");
        // If we only have 1 day of real data, pad it with mock data so the chart draws
        return historicalData.length < 2 ? this.padWithMockData(historicalData) : historicalData;
      }

      console.log("2. Missing recent data. Initiating GitHub/NASA Sync...");
      
      // Step C: Fetch fresh data from GitHub
      const ghResponse = await firstValueFrom(
        this.http.get<any[]>('https://api.github.com/users/vvagraphics/events/public')
      );

      const commitsByDate: Record<string, number> = {};
      ghResponse.forEach(event => {
        if (event.type === 'PushEvent') {
          const date = event.created_at.split('T')[0]; 
          const commitCount = event.payload.commits ? event.payload.commits.length : 0;
          commitsByDate[date] = (commitsByDate[date] || 0) + commitCount;
        }
      });

      const datesToSync = Object.keys(commitsByDate)
        .filter(date => !historicalData.some(d => d.date === date)) // Only sync dates we don't have yet
        .sort();

      if (datesToSync.length === 0) {
        console.log("3. No new public commits to sync.");
        return historicalData.length < 2 ? this.padWithMockData(historicalData) : historicalData;
      }

      // Step D: Calculate Space Weather Modifiers for new dates
      const startDate = datesToSync[0];
      const endDate = datesToSync[datesToSync.length - 1];
      const nasaUrl = `https://api.nasa.gov/DONKI/GST?startDate=${startDate}&endDate=${endDate}&api_key=${this.nasaApiKey}`;
      
      let spaceWeather: any[] = [];
      try {
         spaceWeather = await firstValueFrom(this.http.get<any[]>(nasaUrl)) || [];
      } catch (e) {
         console.warn("NASA Space weather calm or API limit reached.");
      }

      // Step E: Prepare new rows for Supabase
      const newRowsToInsert = datesToSync.map(date => {
        const commits = commitsByDate[date];
        const storm = spaceWeather.find(s => s.startTime.startsWith(date));
        let baseScore = Math.min((commits / 10) * 100, 100); 

        if (storm) {
            const maxKp = Math.max(...storm.allKpIndex.map((k: any) => k.kpIndex));
            if (maxKp > 5 && commits > 5) baseScore = Math.min(baseScore + 25, 100); 
            else if (maxKp > 5 && commits <= 2) baseScore = Math.max(baseScore - 20, 10);
        }

        return {
          date: date,
          commits: commits,
          efficiency_score: Math.round(baseScore)
        };
      });

      // Step F: Save to Supabase!
      console.log("4. Saving new data to Supabase:", newRowsToInsert);
      const { error: insertError } = await this.supabase
        .from('daily_efficiency')
        .insert(newRowsToInsert);

      if (insertError) console.error("Failed to save to database:", insertError);

      // Add the newly saved rows to our historical data for the UI
      const finalData = [...historicalData, ...newRowsToInsert.map(row => ({
        date: row.date,
        commits: row.commits,
        efficiencyScore: row.efficiency_score
      }))].sort((a, b) => a.date.localeCompare(b.date));

      return finalData.length < 2 ? this.padWithMockData(finalData) : finalData;

    } catch (error: any) {
      console.error("Matrix Engine Failure:", error);
      return this.padWithMockData([]);
    }
  }

  // Fallback so your chart never breaks
  private padWithMockData(existingData: DataPoint[]): DataPoint[] {
    const mockData: DataPoint[] = [...existingData];
    const today = new Date();
    
    // Add mock days until we have 14 points to draw a cool line
    let i = 1;
    while (mockData.length < 14) {
      const d = new Date(today);
      d.setDate(today.getDate() - (existingData.length + i));
      const dateStr = d.toISOString().split('T')[0];
      
      if (!mockData.some(m => m.date === dateStr)) {
        mockData.push({
          date: dateStr,
          commits: Math.floor(Math.random() * 15), 
          efficiencyScore: Math.floor(Math.random() * (100 - 40 + 1) + 40) 
        });
      }
      i++;
    }
    
    // Sort chronologically
    return mockData.sort((a, b) => a.date.localeCompare(b.date));
  }
}