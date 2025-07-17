<<<<<<< HEAD
# 🏋️‍♂️ Gym Tracker App

A modern, responsive React-based gym workout tracking application that helps you plan, track, and manage your weekly fitness routine.

## ✨ Features

- **Weekly Workout Planning**: Organize exercises by day of the week
- **Exercise Library**: Pre-built database of exercises categorized by muscle groups
- **Custom Exercises**: Add your own exercises with custom sets and reps
- **Progress Tracking**: Visual progress bar showing weekly completion
- **Interactive Exercise Management**: 
  - Mark exercises as completed, skipped, or incomplete
  - Edit sets, reps, weight, and actual sets performed
  - Drag and drop to reorder exercises
- **Persistent Storage**: Workout data saved locally in browser storage
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Reset Functionality**: Reset individual days or entire weeks

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gym-tracker-app-v2/gym-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be available in the `dist/` directory.

### Linting

```bash
npm run lint
```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── AddExerciseModal.jsx    # Modal for adding new exercises
│   ├── CustomModal.jsx         # Reusable modal component
│   ├── DayAccordion.jsx        # Day workout accordion
│   ├── ExerciseItem.jsx        # Individual exercise item
│   └── ProgressBar.jsx         # Weekly progress visualization
├── constants/          # Application constants
│   └── index.js        # Days of week and exercise database
├── services/           # Business logic
│   └── workoutService.js       # Workout data management
├── utils/             # Utility functions
│   └── dateHelper.js   # Date-related helper functions
├── App.jsx            # Main application component
├── main.jsx           # Application entry point
├── App.css            # Component styles
└── index.css          # Global styles
```

## 🎯 Usage

### Adding Exercises

1. **From Library**: Click "Add Exercise" and select from the pre-built exercise database
2. **Custom Exercise**: Use the "Custom" tab to create your own exercises with specific sets and reps

### Tracking Progress

- **Complete**: Click the green checkmark when you finish an exercise
- **Skip**: Click the red X if you skip an exercise
- **Edit Details**: Click on any field (sets, reps, weight, done) to edit inline
- **Reorder**: Drag and drop exercises using the grip handle

### Managing Workouts

- **Reset Day**: Reset a single day to its default exercises
- **Start New Week**: Reset the entire week and start fresh
- **Progress Tracking**: Monitor your weekly completion percentage in the progress bar

## 🛠️ Technical Details

### Technologies Used

- **React 19**: Modern React with hooks
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library
- **Local Storage**: Browser-based data persistence

### Key Components

- **App.jsx**: Main application state management and routing
- **DayAccordion.jsx**: Expandable day view with exercise management
- **ExerciseItem.jsx**: Individual exercise with drag-drop and editing
- **AddExerciseModal.jsx**: Exercise selection and custom exercise creation
- **ProgressBar.jsx**: Visual progress tracking

### Data Structure

```typescript
// Exercise data structure
{
  id: string,           // Unique identifier
  dbId: number|null,    // Database ID (null for custom exercises)
  name: string,         // Exercise name
  sets: string,         // Target sets (e.g., "3")
  reps: string,         // Target reps (e.g., "8-12")
  weight: string,       // Weight used
  effectiveSets: string, // Actual sets completed
  status: 'incomplete' | 'completed' | 'skipped'
}
```

## 🔧 Configuration

### ESLint Configuration

The project uses ESLint with React-specific rules for code quality:

- React hooks rules
- React refresh rules
- Modern JavaScript standards

### Tailwind CSS

Configured with PostCSS for optimal build performance. Custom styles can be added to:
- `src/index.css` for global styles
- `src/App.css` for component-specific styles

## 📱 Mobile Support

The application is fully responsive and includes:
- Touch-friendly drag and drop
- Mobile-optimized layouts
- Responsive grid systems
- Touch gesture support

## 🚀 Deployment

### Build and Deploy

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `dist/` folder** to your hosting provider of choice:
   - Netlify
   - Vercel
   - GitHub Pages
   - Any static hosting service

### Environment Considerations

- The app uses local storage for data persistence
- No backend server required
- Works entirely in the browser
- Data is device-specific

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Known Issues

- Data is stored locally and won't sync across devices
- Large workout plans may impact performance on older devices
- Browser storage limitations apply

## 🔮 Future Enhancements

- [ ] Cloud synchronization
- [ ] Workout templates
- [ ] Exercise video integration
- [ ] Progress charts and analytics
- [ ] Social sharing features
- [ ] Backup/export functionality

---

Built with ❤️ using React, Vite, and Tailwind CSS
=======
# gym-tracker
>>>>>>> f3641c76a773efd06046a2005b093c42ac60db0a
