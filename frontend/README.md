# AI-Commerce Frontend

This is the frontend for the AI-Commerce application, a marketplace platform.

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Set up Google Maps API:
   - Create a Google Cloud Platform account if you don't have one
   - Create a new project
   - Enable the "Places API" and "Maps JavaScript API" for your project
   - Create an API key with restrictions for HTTP referrers (websites)
   - Copy the API key to your `.env` file:
     ```
     GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
     ```

3. Start the development server:
   ```
   npm run dev
   ```

## Features

- **Location Autocomplete**: When adding a listing, the location field uses Google Maps Places API to autocomplete addresses and ensure valid locations.
- **Image Upload**: Upload images from your device or capture directly using your camera.
- **Form Validation**: Client-side validation ensures all required fields are filled correctly.

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod for validation
- Google Maps API for location services
