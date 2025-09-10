# NovaBoard - Collaborative Whiteboard

NovaBoard is a real-time collaborative whiteboard application that allows users to create and join rooms with unique codes.

## Features

### 🏠 Room Management
- **Create Room**: Generate a unique 6-character room code
- **Join Room**: Enter an existing room code to join
- **Real-time Collaboration**: Multiple users can draw simultaneously
- **Room Codes**: Easy-to-share 6-character alphanumeric codes

### 🎨 Whiteboard Features
- **Real-time Drawing**: See others' drawings as they happen
- **Multiple Tools**: Draw, erase, clear canvas
- **Customizable**: Choose colors and brush sizes
- **Download**: Save your whiteboard as an image

### 🔐 Authentication
- User registration and login
- Secure room access
- User session management

## How to Use

### 1. Getting Started
1. Navigate to the application
2. Create an account or log in
3. Choose "Collaborative Room" from the home page

### 2. Creating a Room
1. Click "Create New Room"
2. A unique 6-character code will be generated
3. Share this code with others
4. Start drawing in your collaborative space

### 3. Joining a Room
1. Click "Join Existing Room"
2. Enter the 6-character room code
3. Join the collaborative session
4. Start drawing with others

### 4. Room Features
- **Participant Count**: See how many people are in the room
- **Connection Status**: Visual indicator of your connection
- **Real-time Updates**: All drawings sync across all participants
- **Leave Room**: Exit the room and return to home

## Technical Details

### Frontend
- React with Vite
- Tailwind CSS for styling
- Socket.io client for real-time communication
- React Router for navigation

### Backend
- Node.js with Express
- Socket.io for WebSocket connections
- JWT authentication
- Room state management

### Room System
- Unique 6-character alphanumeric codes
- Maximum 10 participants per room
- Automatic room cleanup after 5 minutes of inactivity
- Real-time participant tracking

## Development

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   cd NovaBoard/backend && npm install
   cd ../frontend && npm install
   ```
3. Set up environment variables in backend/.env
4. Start the servers:
   ```bash
   # Backend (Terminal 1)
   cd NovaBoard/backend && npm run dev
   
   # Frontend (Terminal 2)
   cd NovaBoard/frontend && npm run dev
   ```

### Environment Variables
Create a `.env` file in the backend directory:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
```

## Room Code Format
Room codes are 6 characters long and use:
- Uppercase letters (A-Z)
- Numbers (0-9)
- Example: `ABC123`, `XYZ789`, `123ABC`

## Security Features
- JWT-based authentication
- Room access validation
- User session management
- Secure WebSocket connections

## Performance Features
- Efficient drawing synchronization
- Optimized network communication
- Automatic room cleanup
- Connection state management

## Browser Support
- Modern browsers with WebSocket support
- Chrome, Firefox, Safari, Edge
- Mobile browsers (with touch support)

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License
This project is licensed under the ISC License.
