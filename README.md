# DeepIndex // Solar Core

**DeepIndex** is a predictive system analytics dashboard built with Angular. It correlates raw developer output (GitHub commits) against localized environmental telemetry—specifically NASA Solar Geomagnetic Storm data—to predict and visualize optimal coding efficiency cycles.

By analyzing the intersection of space weather and coding habits, DeepIndex attempts to map how environmental factors might impact developer focus and productivity.

## 🌟 Features

- **The Matrix Engine:** A custom-built, pure SVG pipeline chart that visualizes commit volume against calculated developer efficiency scores.
- **Time Machine Scrub:** An interactive range slider that allows users to shift through historical records and view the exact environmental context for specific dates.
- **Dynamic Cyberpunk Themes:** The UI reacts to the data. High efficiency triggers a "Neon Gold" theme, while lower efficiency shifts to a "Dark Rain" aesthetic.
- **Space Weather Correlation:** Automatically fetches Coronal Mass Ejection (CME) and Geomagnetic Storm (GST) data from NASA's DONKI API, adjusting efficiency scores based on the Kp Index.
- **Dual-Flow Architecture:** \* **Visitor Mode:** Live-fetches data directly from GitHub and NASA APIs for any searched username.
  - **Owner Mode:** Syncs personal telemetry to a Supabase backend for persistent historical tracking.

## 🛠️ Tech Stack

- **Frontend:** Angular 17+ (Standalone Components), TypeScript
- **Styling:** SCSS, Custom CSS Grid/Flexbox
- **Backend/Database:** Supabase
- **External APIs:** GitHub REST API, NASA DONKI API
- **Data Visualization:** Custom inline SVG with Cubic Bezier curve generation

---

## 🚀 Local Environment Setup

To run this project locally, you must configure your environment variables. The project uses a specific `angular.json` configuration to safely swap in local environment files during development, keeping production credentials secure.

### 1. Install Dependencies

Clone the repository and install the required packages:

```bash
npm install
```

## Config for local environment

ng serve --configuration=local
