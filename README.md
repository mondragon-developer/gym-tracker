# 🏋️‍♂️ Gym Tracker App

A modern, responsive React-based gym workout tracking application that helps you plan, track, and manage your weekly fitness routine with a complete Push/Pull/Leg split workout system.

## Features

### Core Functionality
- **Weekly Workout Planning**: Pre-loaded 6-day Push/Pull/Leg split with comprehensive exercises
- **Smart Exercise System**: 
  - **Strength Training**: Traditional sets, reps, and weight tracking
  - **Cardio Exercises**: Time-based tracking (1-120 minutes) instead of sets/reps
- **Advanced Exercise Library**: 200+ exercises categorized by muscle groups
- **Universal Search**: Search exercises across all muscle groups with real-time filtering
- **Custom Exercise Creation**: Add your own exercises with flexible sets/reps configuration
- **Multi-Muscle Group Selection**: Select up to 3 muscle groups per day with intelligent UI

### Progress & Tracking
- **Visual Progress Bar**: Real-time weekly completion tracking
- **Interactive Exercise Management**: 
  - Mark exercises as completed, skipped, or incomplete
  - Live editing of sets, reps, weight, and completion status
  - Drag and drop exercise reordering
- **Intelligent Exercise Display**: Context-aware UI that adapts to exercise type
- **Persistent Storage**: All workout data saved locally with automatic sync

### Modern Design & UX
- **Professional Branding**: Custom logo integration with vibrant teal gradient design
- **Responsive Mobile-First Design**: Optimized for all screen sizes
- **Compact Layout**: Space-efficient design for maximum content visibility
- **Intuitive UI**: Color-coded muscle groups and status indicators
- **Search Highlighting**: Visual search term highlighting in exercise names

### Customization & Flexibility
- **Dynamic Muscle Group Assignment**: Change any day's focus with dropdown selection
- **Custom Default Settings**: Set preferred sets (1-10) and reps (1-20) for exercises
- **Exercise Type Detection**: Automatic detection and handling of cardio vs strength exercises
- **Reset Options**: Reset individual days or entire weeks
- **Workout Templates**: Pre-configured Push/Pull/Leg split with 20+ exercises

## Getting Started

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

## Project Structure

```
src/
├── components/          # React components
│   ├── AddExerciseModal.jsx    # Enhanced modal with search & filtering
│   ├── CustomModal.jsx         # Reusable modal with white background
│   ├── DayAccordion.jsx        # Day workout with muscle group selection
│   ├── ExerciseItem.jsx        # Smart exercise item (cardio/strength)
│   ├── NewModal.jsx            # Updated modal component
│   └── ProgressBar.jsx         # Weekly progress visualization
├── constants/          # Application constants
│   └── index.js        # 200+ exercises, muscle groups, days
├── services/           # Business logic
│   └── workoutService.js       # Complete Push/Pull/Leg workout data
├── utils/             # Utility functions
│   └── dateHelper.js   # Date-related helper functions
├── assets/            # Static assets
│   └── mdlogo.jpeg    # Custom logo file
├── App.jsx            # Main application with logo integration
├── main.jsx           # Application entry point
├── App.css            # Component styles
└── index.css          # Global styles
```

## Usage Guide

### Workout System

The app comes pre-loaded with a complete **6-day Push/Pull/Leg split**:

- **Monday & Thursday**: Push Day (Chest, Shoulders, Triceps)
- **Tuesday & Friday**: Pull Day (Back, Biceps)  
- **Wednesday & Saturday**: Leg Day (Legs, Calves)
- **Sunday**: Rest Day

### Adding Exercises

#### From Exercise Library
1. Click "Add Exercise" button
2. **Search by name**: Type any exercise name for instant filtering
3. **Filter by muscle group**: Select specific muscle groups or "All"
4. **Set defaults**: Configure default sets (1-10) and reps (1-20)
5. **Cardio exercises**: Automatically show duration selector (1-120 minutes)

#### Custom Exercises
1. Switch to "Custom" tab
2. Enter exercise name, sets, and reps
3. Exercise will be added with your specifications

### Exercise Management

#### Strength Training Exercises
- **Sets**: Editable field for target sets
- **Reps**: Editable field for target rep range
- **Weight**: Track weight used (lbs/kg)
- **Done**: Mark completed sets

#### Cardio Exercises
- **Duration**: Select target time (1-120 minutes)
- **Completed**: Track actual time completed
- **No weight tracking**: Clean, time-focused interface

### Customization Options

#### Muscle Group Selection
- Click the edit icon (✏️) next to any day's muscle group
- Select up to 3 individual muscle groups
- Options include: Chest, Back, Shoulders, Biceps, Triceps, Forearms, Legs, Abs, Cardio
- Special "Rest" option for recovery days

#### Default Exercise Settings
- **Sets**: Choose 1-10 sets as default for new exercises
- **Reps**: Set min and max rep ranges (1-20 each)
- **Live preview**: See how exercises will appear before adding

### Progress Tracking

- **Visual progress bar**: Shows completion percentage for the week
- **Exercise counter**: Displays completed vs total exercises
- **Status indicators**: ✅ Completed, ⏭️ Skipped, ⏱️ Incomplete
- **Real-time updates**: Progress updates instantly as you mark exercises

## Technical Details

### Technologies Used

- **React 19**: Modern React with hooks and latest features
- **Vite**: Lightning-fast build tool and development server
- **Inline Styles**: Component-scoped styling for better maintainability
- **Lucide React**: Beautiful, consistent icon library
- **Local Storage**: Browser-based data persistence
- **Modern JavaScript**: ES6+ features and best practices

### Key Improvements

#### Enhanced Exercise System
- **Smart exercise detection**: Automatically identifies cardio vs strength exercises
- **Context-aware UI**: Different interfaces for different exercise types
- **Comprehensive database**: 200+ exercises across 10 muscle groups
- **Advanced search**: Real-time filtering with search term highlighting

#### Improved User Experience
- **Mobile optimization**: Touch-friendly controls and responsive design
- **Compact layouts**: Reduced spacing for better content density
- **Visual feedback**: Hover effects, color coding, and status indicators
- **Professional design**: Custom logo integration with cohesive branding

#### Technical Enhancements
- **Modular architecture**: Clean separation of concerns
- **Type safety**: JSDoc type definitions for better development experience
- **Performance optimized**: Efficient rendering and state management
- **Cross-browser compatibility**: Tested across modern browsers

### Data Structure

```javascript
// Exercise data structure
{
  id: string,              // Unique identifier
  dbId: number|null,       // Database ID (null for custom exercises)
  name: string,            // Exercise name
  sets: string,            // Target sets OR duration for cardio
  reps: string,            // Target reps (empty for cardio)
  weight: string,          // Weight used (empty for cardio)
  effectiveSets: string,   // Completed sets OR minutes for cardio
  status: 'incomplete' | 'completed' | 'skipped'
}

// Muscle group support
muscleGroups: [
  'Rest', 'Chest', 'Back', 'Shoulders', 'Biceps', 
  'Triceps', 'Forearms', 'Legs', 'Abs', 'Cardio'
]
```

## Mobile Support

The application is fully responsive and includes:
- **Touch-optimized**: Large touch targets and gesture support
- **Mobile-first design**: Optimized layouts for small screens
- **Compact interface**: Efficient use of screen real estate
- **Swipe gestures**: Natural mobile interactions
- **Responsive grids**: Adaptive layouts for all screen sizes

## Design Features

### Visual Branding
- **Custom logo integration**: Professional MD logo with teal color scheme
- **Gradient design**: Vibrant teal-to-dark gradient header
- **Clean typography**: Modern, readable font choices
- **Color-coded system**: Different colors for different muscle groups

### User Interface
- **Intuitive navigation**: Clear visual hierarchy and organization
- **Status indicators**: Easy-to-understand progress markers
- **Smart layouts**: Context-aware interface adaptations
- **Accessibility**: High contrast and clear visual feedback

## Deployment

### Build and Deploy

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `dist/` folder** to your hosting provider:
   - Netlify
   - Vercel
   - GitHub Pages
   - Any static hosting service

### Environment Considerations

- **Client-side only**: No backend server required
- **Local storage**: Data persisted in browser storage
- **Device-specific**: Data doesn't sync across devices
- **Offline capable**: Works without internet connection

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Future Enhancements

### Planned Features
- [ ] **Cloud synchronization**: Sync workouts across devices
- [ ] **Workout analytics**: Progress charts and performance metrics
- [ ] **Exercise videos**: Integrated exercise demonstrations
- [ ] **Social features**: Share workouts and progress
- [ ] **Advanced templates**: More workout split options
- [ ] **Timer integration**: Rest timers and workout timing
- [ ] **Export functionality**: Export workouts to PDF/CSV
- [ ] **Nutrition tracking**: Basic meal and calorie logging
- [ ] **Achievement system**: Workout milestones and badges

### Technical Improvements
- [ ] **PWA support**: Offline functionality and app installation
- [ ] **Data export/import**: Backup and restore functionality
- [ ] **Theme customization**: Dark mode and color themes
- [ ] **Advanced search**: Exercise filtering by equipment, difficulty
- [ ] **Performance optimization**: Virtual scrolling for large lists



**Built by Jose Mondragon**
