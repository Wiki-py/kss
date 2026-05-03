# OBB Baseline Survey System - Progressive Web App

A modern, offline-capable Progressive Web App (PWA) for the OBB Kingdom baseline survey system, built with vanilla HTML, CSS, and JavaScript.

## 🎯 Features

### Core Functionality
- **Progressive Web App**: Installable on any device (Android/iOS/Desktop)
- **Offline First**: Works without internet connection, syncs when online
- **Role-Based Access**: Agent, Admin, and Super Admin roles with different permissions
- **Device Registration**: Automatic device ID detection and registration
- **Dynamic Survey Forms**: Multi-section surveys with repeating tables and media capture
- **Real-time Sync**: Background sync when network becomes available

### User Roles
- **Agent**: Create and submit surveys, view own submissions
- **Admin**: Manage agents, view survey results, generate reports
- **Super Admin**: Full system control, user management, device control

### Technical Features
- **IndexedDB Storage**: Local database for offline data persistence
- **Service Worker**: Caching and offline functionality
- **PWA Install Prompt**: Native app installation experience
- **Responsive Design**: Mobile-first design that works on all devices
- **Theme System**: Red, Yellow, Green color palette for OBB Kingdom

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server for development
- Django backend API (optional for full functionality)

### Installation

1. **Clone or download the frontend files**
2. **Start a local web server**:
   ```bash
   # Using Node.js
   npx serve .

   # Or using Python
   python -m http.server 8080

   # Or using PHP
   php -S localhost:8080
   ```
3. **Open in browser**: Navigate to `http://localhost:8080`
4. **Install as PWA**: Click the install prompt or use browser menu

### Backend Integration

For full functionality, connect to the Django backend:

1. **Start Django backend**:
   ```bash
   cd ../survey
   python manage.py runserver
   ```

2. **Configure API URL**: The app automatically connects to `http://localhost:8000/api`

3. **Create users**: Use Django admin to create users with roles:
   - Agent: `agent001` (password: `password123`)
   - Admin: `admin001` (password: `password123`)
   - Super Admin: `superadmin` (password: `password123`)

## 📱 Usage

### For Agents
1. **Login** with agent credentials
2. **Create New Survey** using the dynamic form
3. **Fill Survey Sections**:
   - Basic Information
   - Clan Details
   - Population Statistics
   - Sub-Clans (dynamic)
   - Executive Committee (dynamic)
   - Photo Capture
   - Signatures
4. **Save Draft** or **Submit Survey**
5. **Sync** when online (automatic)

### For Admins
1. **Login** with admin credentials
2. **View Dashboard** with statistics
3. **Manage Agents**: View, edit, deactivate agents
4. **View Survey Results**: Browse and analyze submitted surveys
5. **Generate Reports**: Create PDF reports and CSV exports

### For Super Admins
1. **Login** with super admin credentials
2. **System Administration**: Full control over all aspects
3. **User Management**: Add/edit users, manage roles and permissions
4. **Device Management**: Register and control devices
5. **Activity Logs**: Monitor system activity and audit trails

## 🔧 Technical Architecture

### File Structure
```
frontend/
├── index.html              # Main HTML entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── css/
│   └── style.css          # Custom styles with red/yellow/green theme
├── js/
│   ├── app.js             # Main application logic
│   ├── auth.js            # Authentication module
│   ├── device.js          # Device detection and registration
│   ├── db.js              # IndexedDB database operations
│   ├── sync.js            # Offline sync functionality
│   ├── installPrompt.js   # PWA install prompt
│   ├── config.js          # Application configuration
│   └── utils.js           # Utility functions
└── README.md              # This file
```

### Key Technologies
- **HTML5**: Semantic markup, PWA features
- **CSS3**: Custom properties, responsive design
- **JavaScript ES6+**: Modules, async/await, fetch API
- **IndexedDB**: Local data storage with Dexie.js wrapper
- **Service Worker**: Caching and offline functionality
- **PWA**: Manifest, install prompts, background sync

### Data Flow
1. **User Input** → Form validation → IndexedDB storage
2. **Online Mode**: Direct API calls → Backend → Response
3. **Offline Mode**: IndexedDB storage → Outbox queue → Background sync
4. **Sync Process**: Outbox → API → Remove from queue → Update UI

## 🎨 Design System

### Color Palette
```css
:root {
  --kingdom-red: #dc2626;
  --kingdom-yellow: #fbbf24;
  --kingdom-green: #22c55e;
  --kingdom-dark: #991b1b;
  --kingdom-light: #fef2f2;
  --kingdom-yellow-light: #fef3c7;
  --kingdom-green-light: #dcfce7;
}
```

### Component Library
- **Buttons**: Primary (red), Success (green), Warning (yellow)
- **Cards**: White background, colored borders
- **Forms**: Red focus states, validation styling
- **Tables**: Clean, responsive design
- **Badges**: Status indicators (success/warning/danger)

### Responsive Breakpoints
- **Mobile**: < 768px (single column, bottom nav)
- **Tablet**: 768px - 1024px (two columns)
- **Desktop**: > 1024px (multi-column layout)

## 🔐 Security

### Authentication
- JWT tokens stored in localStorage
- Automatic token refresh
- Device ID validation
- Role-based access control

### Data Protection
- Local encryption for sensitive data
- Secure API communication (HTTPS in production)
- Input validation and sanitization
- Audit logging for system actions

## 📊 Offline Functionality

### Caching Strategy
- **Static Assets**: Cache-first strategy
- **API Responses**: Network-first with cache fallback
- **User Data**: IndexedDB for persistence

### Sync Process
1. **Detect Network Status**: Online/offline indicators
2. **Queue Operations**: Store in outbox when offline
3. **Background Sync**: Automatic sync when online
4. **Conflict Resolution**: Server-side validation

## 🚀 Deployment

### Static Hosting
```bash
# Build for production
# (No build step required - vanilla JS)

# Deploy to any static host
rsync -av frontend/ user@server:/var/www/html/
```

### Django Integration
```bash
# Copy to Django static files
cp -r frontend/* survey/static/survey/

# Update Django settings
# STATIC_URL = '/static/'
# STATIC_ROOT = 'staticfiles'
```

### CDN Deployment
- Upload to AWS S3 + CloudFront
- Use Netlify/Vercel for easy deployment
- GitHub Pages for simple hosting

## 🐛 Troubleshooting

### Common Issues

**PWA Not Installing**
- Ensure HTTPS (or localhost for development)
- Check service worker registration
- Verify manifest.json is accessible

**Offline Mode Not Working**
- Check service worker registration
- Verify IndexedDB permissions
- Test with browser dev tools

**Sync Issues**
- Check network connectivity
- Verify API endpoints are accessible
- Review IndexedDB outbox contents

**Form Validation Errors**
- Check required field markers
- Verify input format requirements
- Review browser console for errors

### Debug Tools
- **Browser Dev Tools**: Console, Network, Application tabs
- **Service Worker Tools**: Chrome DevTools > Application > Service Workers
- **IndexedDB Viewer**: Chrome DevTools > Application > IndexedDB
- **PWA Testing**: Lighthouse audit for PWA compliance

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make changes following coding standards
4. Test thoroughly (including offline functionality)
5. Submit pull request

### Code Standards
- Use ES6+ JavaScript features
- Follow responsive design principles
- Test offline functionality
- Maintain PWA best practices
- Document new features

## 📄 License

This project is part of the OBB Baseline Survey System. Contact the development team for licensing information.

## 📞 Support

For technical support or questions:
- Check the troubleshooting section
- Review browser console for errors
- Test with different browsers
- Contact the development team

---

**Note**: This is a Progressive Web App designed for the OBB Kingdom baseline survey system. It works offline first and provides a native app experience on any device.
