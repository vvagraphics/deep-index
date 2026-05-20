import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js'; 
import { DataPoint } from '../matrix-chart'; 
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DeepIndexService {
  private http = inject(HttpClient);
  private nasaApiKey = environment.nasaApiKey; 
  
  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl, 
    environment.supabaseKey
  );

  // FIX 1: Added the username parameter
  async fetchDashboardData(username: string = 'vvagraphics'): Promise<DataPoint[]> {
    try {
      const cleanUsername = username.replace('https://github.com/', '').replace('/', '').trim();
      const isOwner = cleanUsername.toLowerCase() === 'vvagraphics';

      console.log(`1. Scanning digital footprint for: ${cleanUsername}`);
      
      // ==========================================
      // OWNER FLOW (Supabase Sync)
      // ==========================================
      if (isOwner) {
         console.log("2. Owner mode active. Connecting to Matrix Mainframe (Supabase)...");
         
         // FIX 2: Restored the database fetch logic for dbData
         const { data: dbData, error } = await this.supabase
           .from('daily_efficiency')
           .select('date, commits, efficiency_score')
           .order('date', { ascending: true });

         if (error) throw error;

         // FIX 3: Added 'row: any' to satisfy TypeScript strict mode
         let historicalData: DataPoint[] = (dbData || []).map((row: any) => ({
           date: row.date,
           commits: row.commits,
           efficiencyScore: row.efficiency_score
         }));

         const today = new Date().toISOString().split('T')[0];
         const hasSyncedToday = historicalData.some(d => d.date === today);

         if (hasSyncedToday) {
           console.log("3. Database is up to date. Loading historical data.");
           return historicalData.length < 2 ? this.padWithMockData(historicalData) : historicalData;
         }

         console.log("3. Missing recent data. Initiating GitHub/NASA Sync...");
         
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
           .filter(date => !historicalData.some(d => d.date === date))
           .sort();

         if (datesToSync.length === 0) {
           return historicalData.length < 2 ? this.padWithMockData(historicalData) : historicalData;
         }

         const startDate = datesToSync[0];
         const endDate = datesToSync[datesToSync.length - 1];
         const nasaUrl = `https://api.nasa.gov/DONKI/GST?startDate=${startDate}&endDate=${endDate}&api_key=${this.nasaApiKey}`;
         
         let spaceWeather: any[] = [];
         try { spaceWeather = await firstValueFrom(this.http.get<any[]>(nasaUrl)) || []; } catch(e) {}

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

         const { error: insertError } = await this.supabase
           .from('daily_efficiency')
           .insert(newRowsToInsert);

         if (insertError) console.error("Failed to save to database:", insertError);

         const finalData = [...historicalData, ...newRowsToInsert.map(row => ({
           date: row.date,
           commits: row.commits,
           efficiencyScore: row.efficiency_score
         }))].sort((a, b) => a.date.localeCompare(b.date));

         return finalData.length < 2 ? this.padWithMockData(finalData) : finalData;
      }

      // ==========================================
      // VISITOR FLOW (Live Fetch Only, No Database Saving)
      // ==========================================
      console.log("2. Visitor mode active. Fetching live API data...");
      
      const ghResponse = await firstValueFrom(
        this.http.get<any[]>(`https://api.github.com/users/${cleanUsername}/events/public`)
      );

      const commitsByDate: Record<string, number> = {};
      ghResponse.forEach(event => {
        if (event.type === 'PushEvent') {
          const date = event.created_at.split('T')[0]; 
          const commitCount = event.payload.commits ? event.payload.commits.length : 0;
          commitsByDate[date] = (commitsByDate[date] || 0) + commitCount;
        }
      });

      const dates = Object.keys(commitsByDate).sort();
      if (dates.length < 2) return this.padWithMockData([]); 

      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      const nasaUrl = `https://api.nasa.gov/DONKI/GST?startDate=${startDate}&endDate=${endDate}&api_key=${this.nasaApiKey}`;
      
      let spaceWeather: any[] = [];
      try { spaceWeather = await firstValueFrom(this.http.get<any[]>(nasaUrl)) || []; } catch(e) {}

      const finalData: DataPoint[] = dates.map(date => {
        const commits = commitsByDate[date];
        const storm = spaceWeather.find(s => s.startTime.startsWith(date));
        let baseScore = Math.min((commits / 10) * 100, 100); 

        if (storm) {
            const maxKp = Math.max(...storm.allKpIndex.map((k: any) => k.kpIndex));
            if (maxKp > 5 && commits > 5) baseScore = Math.min(baseScore + 25, 100); 
            else if (maxKp > 5 && commits <= 2) baseScore = Math.max(baseScore - 20, 10);
        }
        return { date, commits, efficiencyScore: Math.round(baseScore) };
      });

      return finalData;

    } catch (error: any) {
      console.error("User not found or API failure.", error);
      throw error; 
    }
  }

  private padWithMockData(existingData: DataPoint[]): DataPoint[] {
    const mockData: DataPoint[] = [...existingData];
    const today = new Date();
    
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
    
    return mockData.sort((a, b) => a.date.localeCompare(b.date));
  }
}