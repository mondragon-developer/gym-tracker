/**
 * Main Application Component
 * Refactored to follow SOLID principles with proper separation of concerns
 */

import React, { useState, useRef } from 'react';
import useWorkoutPlan from './hooks/useWorkoutPlan.js';
import useModal from './hooks/useModal.js';
import ProgressBar from './components/ProgressBar';
import DayAccordion from './components/DayAccordion';
import AddExerciseModal from './components/AddExerciseModal';
import Modal from './components/ui/Modal.jsx';
import Button, { ButtonVariant } from './components/ui/Button.jsx';
import { getToday } from './utils/dateHelper';
import { DAYS_OF_WEEK } from './constants/AppConstants.js';
import mdLogo from './assets/mdlogo.jpeg';

/**
 * Main Application Component
 * Focuses solely on UI orchestration, delegating business logic to services and hooks
 * @returns {React.ReactElement} The main app component
 */
export default function App() {
    // Custom hooks for state management (Single Responsibility)
    const {
        workoutPlan,
        isLoading,
        error,
        addExercise,
        resetDay,
        resetWeek,
        updateDay
    } = useWorkoutPlan();
    
    const resetModal = useModal();
    const addExerciseModal = useModal();
    
    // UI state
    const [activeDay, setActiveDay] = useState(getToday());
    const activeDayRef = useRef(null);

    // Scroll active day into view when it changes
    React.useEffect(() => {
        if (activeDayRef.current) {
            activeDayRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [activeDay]);

    /**
     * Event handlers - focused only on UI coordination
     */
    const handleToggleDay = (day) => {
        setActiveDay(activeDay === day ? null : day);
    };

    const handleResetDay = (day) => {
        if (window.confirm("Are you sure you want to reset this day's exercises?")) {
            resetDay(day);
        }
    };

    const handleResetWeek = () => {
        resetWeek();
        resetModal.close();
        setActiveDay(getToday());
    };

    const handleOpenAddExercise = (day) => {
        addExerciseModal.open(day);
    };

    const handleAddExercise = (exerciseData) => {
        if (addExerciseModal.data) {
            addExercise(addExerciseModal.data, exerciseData);
            addExerciseModal.close();
        }
    };

    // Handle loading and error states
    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ fontSize: '24px', color: '#6b7280' }}>Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{ fontSize: '24px', color: '#ef4444' }}>Error: {error}</div>
                <Button onClick={() => window.location.reload()}>Reload App</Button>
            </div>
        );
    }

    if (!workoutPlan) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ fontSize: '24px', color: '#6b7280' }}>No workout plan available</div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'white',
            color: '#374151',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '32px auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '40px 32px',
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 20%, #0e7490 40%, #155e75 60%, #164e63 80%, #0f172a 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <img 
                        src={mdLogo} 
                        alt="MD Logo" 
                        style={{
                            width: '150px',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: '50%',
                            border: '5px solid rgba(255, 255, 255, 0.4)',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 0 30px rgba(6, 182, 212, 0.3)'
                        }}
                    />
                    <div style={{ textAlign: 'center' }}>
                        <p style={{
                            color: 'white',
                            fontSize: '16px',
                            margin: '0 0 4px 0',
                            fontWeight: '500'
                        }}>
                            Track your weekly fitness progress
                        </p>
                        <p style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '14px',
                            margin: '0',
                            fontWeight: '400'
                        }}>
                            By Jose Mondragon
                        </p>
                    </div>
                </div>

                {/* Progress Section */}
                <div style={{ 
                    padding: '24px 32px 20px 32px',
                    backgroundColor: 'white'
                }}>
                    <ProgressBar workoutPlan={workoutPlan} />
                </div>

                {/* Days Container */}
                <div style={{ 
                    padding: '0 32px 24px',
                    backgroundColor: 'white'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {DAYS_OF_WEEK.map(day => (
                            <DayAccordion
                                key={day}
                                day={day}
                                data={workoutPlan[day]}
                                isOpen={activeDay === day}
                                onToggle={handleToggleDay}
                                onUpdateDay={updateDay}
                                onResetDay={handleResetDay}
                                onOpenAddExercise={handleOpenAddExercise}
                                activeDayRef={activeDayRef}
                            />
                        ))}
                    </div>

                    {/* Action Button */}
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <Button
                            variant={ButtonVariant.DANGER}
                            onClick={resetModal.open}
                            fullWidth
                            style={{ maxWidth: '320px' }}
                        >
                            🔄 Start New Week
                        </Button>
                    </div>
                </div>
            </div>

            {/* Reset Modal */}
            <Modal
                isOpen={resetModal.isOpen}
                onClose={resetModal.close}
                title="🔄 Confirm Reset"
            >
                <p style={{ 
                    marginBottom: '24px', 
                    color: '#6b7280', 
                    fontSize: '16px',
                    lineHeight: '1.6',
                    margin: '0 0 24px 0'
                }}>
                    Are you sure you want to start a new week? This will reset all exercises and progress to the default plan.
                </p>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <Button 
                        variant={ButtonVariant.SECONDARY}
                        onClick={resetModal.close}
                        fullWidth
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant={ButtonVariant.DANGER}
                        onClick={handleResetWeek}
                        fullWidth
                    >
                        Reset Week
                    </Button>
                </div>
            </Modal>

            {/* Add Exercise Modal */}
            <AddExerciseModal
                isOpen={addExerciseModal.isOpen}
                onClose={addExerciseModal.close}
                onAddExercise={handleAddExercise}
                muscleGroup={addExerciseModal.data && workoutPlan ? workoutPlan[addExerciseModal.data].name.split(' & ')[0] : ''}
            />
        </div>
    );
}