# Running Locally

This guide will help you run the email signature tool locally for development and testing.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** (comes with Node.js)
3. **OpenAI API Key** (required for the AI features)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory (or set environment variables):

```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

**Note:** The `.env` file is typically gitignored, so you'll need to create it locally.

### 3. Run in Development Mode (Recommended)

For the best development experience with hot reload:

**Terminal 1 - Start the API server:**
```bash
npm run start
```
This will start the Express server on `http://localhost:3000` (or the PORT you specified).

**Terminal 2 - Start the Vite dev server:**
```bash
npm run dev
```
This will start the Vite dev server (usually on `http://localhost:5173`).

The Vite dev server will automatically proxy API requests to the Express server, so you can access the app at `http://localhost:5173`.

### 4. Alternative: Production Build

If you want to test the production build locally:

```bash
# Build the frontend
npm run build

# Start the server (serves the built files)
npm start
```

Then visit `http://localhost:3000` (or your PORT).

## Development vs Production

- **Development mode** (`npm run dev`): 
  - Hot module replacement (instant updates)
  - Better error messages
  - Vite dev server on port 5173
  - API server on port 3000
  
- **Production mode** (`npm run build` + `npm start`):
  - Optimized, minified code
  - Single server on port 3000
  - Matches production environment

## Troubleshooting

- **API calls failing**: Make sure the Express server is running on port 3000
- **OpenAI errors**: Verify your `OPENAI_API_KEY` is set correctly
- **Port already in use**: Change the `PORT` in your `.env` file or kill the process using that port

