# Senti Backend API

A Node.js/Express backend server for the Senti project that provides API endpoints to interact with MongoDB data.

## Features

- RESTful API endpoints for CRUD operations
- MongoDB integration with Mongoose ODM
- Rate limiting and security middleware
- Pagination support
- Data aggregation and statistics
- Heroku deployment ready
- Comprehensive error handling

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository and navigate to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp env.example .env
# Edit .env with your configuration
```

4. Start the development server:

```bash
npm run dev
```

The server will start on `http://localhost:5001`

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/senti
JWT_SECRET=your-secret-key
API_KEY=your-api-key
```

## API Endpoints

### Health Check

- `GET /health` - Server health status

### Data Endpoints

#### Get All Data

- `GET /api/data` - Get all data with pagination
  - Query params: `page`, `limit`, `sortBy`, `sortOrder`, `symbol`, `source`

#### Get Statistics

- `GET /api/data/stats` - Get data statistics and distribution

#### Get Data by ID

- `GET /api/data/:id` - Get specific data by ID

#### Get Data by Symbol

- `GET /api/data/symbol/:symbol` - Get data for a specific symbol
  - Query params: `limit`

#### Get Latest Data

- `GET /api/data/latest/:limit?` - Get latest data entries
  - Query params: `symbol`

#### Get Data by Date Range

- `GET /api/data/range/:startDate/:endDate` - Get data within date range
  - Query params: `symbol`
  - Date format: ISO 8601 (e.g., `2024-01-01T00:00:00Z`)

#### Get Aggregated Data

- `GET /api/data/aggregated/:period` - Get aggregated data
  - Period options: `1h`, `1d`, `1w`, `1m`
  - Query params: `symbol`

#### Create Data

- `POST /api/data` - Create new data entry
  - Body: JSON object with data fields

#### Update Data

- `PUT /api/data/:id` - Update existing data entry
  - Body: JSON object with fields to update

#### Delete Data

- `DELETE /api/data/:id` - Delete data entry

## Data Model

The main data model includes:

```javascript
{
  symbol: String,           // Trading pair (e.g., "BTC/USDT")
  price: Number,           // Current price
  sentiment: Number,       // Sentiment score (-1 to 1)
  volume: Number,          // Trading volume
  marketCap: Number,       // Market capitalization
  fearGreedIndex: Number,  // Fear & Greed Index (0-100)
  socialSentiment: {
    twitter: Number,
    reddit: Number,
    news: Number
  },
  technicalIndicators: {
    rsi: Number,
    macd: Number,
    bollingerBands: {
      upper: Number,
      middle: Number,
      lower: Number
    }
  },
  metadata: {
    source: String,
    confidence: Number,
    tags: [String]
  },
  timestamp: Date
}
```

## Starting the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Direct Node.js

```bash
node server.js
```

The server will be available at `http://localhost:5001`

## Testing the API

After starting the server, you can test the endpoints:

```bash
# Test all endpoints
npm run test:api

# Or test manually
curl http://localhost:5001/health
curl http://localhost:5001/
curl http://localhost:5001/api/data
```

## Deployment

### Heroku Deployment

1. Create a Heroku app:

```bash
heroku create your-app-name
```

2. Add MongoDB addon (MongoDB Atlas):

```bash
heroku addons:create mongolab:sandbox
```

3. Set environment variables:

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-secret
```

4. Deploy:

```bash
git push heroku main
```

### Local MongoDB Setup

1. Install MongoDB locally or use Docker:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

2. Update your `.env` file with the local MongoDB URI:

```env
MONGODB_URI=mongodb://localhost:27017/senti
```

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:api` - Test API endpoints

### Project Structure

```
backend/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── Procfile              # Heroku deployment
├── env.example           # Environment variables template
├── test-api.js           # API testing script
├── routes/
│   └── data.js           # Data API routes
├── controllers/
│   └── dataController.js # Data CRUD operations
├── models/
│   └── Data.js           # MongoDB data model
└── middleware/           # Custom middleware (future)
```

## Error Handling

The API includes comprehensive error handling:

- 400: Bad Request (validation errors)
- 404: Not Found (resource not found)
- 500: Internal Server Error (server errors)

All errors return JSON responses with error details.

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation
- Error message sanitization in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
