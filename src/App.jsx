import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import workoutService from './services/workoutService';
import ProgressBar from './components/ProgressBar';
import DayAccordion from './components/DayAccordion';
import CustomModal from './components/CustomModal';
import AddExerciseModal from './components/AddExerciseModal';
import { getToday } from './utils/dateHelper';
import { DAYS_OF_WEEK } from './constants/index.js';

/**
 * The main application component.
 * It manages the overall state and orchestrates the child components.
 * @returns {React.ReactElement}
 */
export default function App() {
    const [workoutPlan, setWorkoutPlan] = useState(null);
    const [activeDay, setActiveDay] = useState(getToday());
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const activeDayRef = useRef(null);

    // --- State Initialization ---
    // On initial render, load the workout plan from our service (localStorage).
    useEffect(() => {
        setWorkoutPlan(workoutService.getPlan());
    }, []);

    // --- Data Persistence ---
    // This effect runs whenever the workoutPlan state changes, saving it to localStorage.
    useEffect(() => {
        if (workoutPlan) {
            workoutService.savePlan(workoutPlan);
        }
    }, [workoutPlan]);
    
    // --- UI Effects ---
    // This effect scrolls the active day into view when it changes.
    useEffect(() => {
        if (activeDayRef.current) {
            activeDayRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [activeDay]);

    /**
     * Toggles the visibility of a day's accordion.
     * @param {string} day - The day to toggle.
     */
    const handleToggleDay = (day) => {
        setActiveDay(activeDay === day ? null : day);
    };

    /**
     * Updates the data for a specific day in the workout plan.
     * @param {string} day - The day to update.
     * @param {DayPlan} data - The new data for the day.
     */
    const handleUpdateDay = (day, data) => {
        const newPlan = { ...workoutPlan, [day]: data };
        setWorkoutPlan(newPlan);
    };
    
    /**
     * Resets a single day to its default state from the initial plan.
     * @param {string} day - The day to reset.
     */
    const handleResetDay = (day) => {
        if (window.confirm("Are you sure you want to reset this day's exercises?")) {
            const originalDayData = workoutService.getInitialPlan()[day];
            const newPlan = { ...workoutPlan, [day]: originalDayData };
            setWorkoutPlan(newPlan);
        }
    }

    /**
     * Resets the entire week to the default plan.
     */
    const handleResetWeek = () => {
        setWorkoutPlan(workoutService.getInitialPlan());
        setIsResetModalOpen(false);
        setActiveDay(getToday());
    };

    /**
     * Opens the add exercise modal for a specific day.
     */
    const handleOpenAddExercise = (day) => {
        setSelectedDay(day);
        setIsAddExerciseModalOpen(true);
    };

    /**
     * Closes the add exercise modal.
     */
    const handleCloseAddExercise = () => {
        setIsAddExerciseModalOpen(false);
        setSelectedDay(null);
    };

    /**
     * Adds an exercise to the selected day.
     */
    const handleAddExercise = (newExercise) => {
        if (!selectedDay || !workoutPlan) return;
        
        const exerciseToAdd = {
            ...newExercise,
            id: `ex_${Date.now()}`,
            weight: "",
            effectiveSets: "",
            status: "incomplete",
        };
        
        const updatedExercises = [...workoutPlan[selectedDay].exercises, exerciseToAdd];
        const updatedPlan = {
            ...workoutPlan,
            [selectedDay]: {
                ...workoutPlan[selectedDay],
                exercises: updatedExercises
            }
        };
        
        setWorkoutPlan(updatedPlan);
        handleCloseAddExercise();
    };

    // Render a loading state until the plan is loaded from localStorage.
    if (!workoutPlan) {
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

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'white',
            color: '#374151',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                backgroundColor: 'white',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '2px solid #a855f7',
                margin: '32px auto'
            }}>
                {/* Header */}
                <div style={{
                    padding: '32px',
                    background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 50%, #6366f1 100%)',
                }}>
                    <h1 style={{
                        fontSize: '40px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: 'white',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        marginBottom: '8px',
                        margin: '0'
                    }}>
                        💪 GYM TRACKER
                    </h1>
                    <p style={{
                        textAlign: 'center',
                        color: '#e0e7ff',
                        fontSize: '16px',
                        margin: '0'
                    }}>
                        Track your weekly fitness progress
                    </p>
                </div>

                {/* Progress Section */}
                <div style={{ padding: '32px' }}>
                    <ProgressBar workoutPlan={workoutPlan} />
                </div>

                {/* Days Container */}
                <div style={{ padding: '0 32px 32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {DAYS_OF_WEEK.map(day => (
                            <DayAccordion
                                key={day}
                                day={day}
                                data={workoutPlan[day]}
                                isOpen={activeDay === day}
                                onToggle={handleToggleDay}
                                onUpdateDay={handleUpdateDay}
                                onResetDay={handleResetDay}
                                onOpenAddExercise={handleOpenAddExercise}
                                activeDayRef={activeDayRef}
                            />
                        ))}
                    </div>

                    {/* Action Button */}
                    <div style={{ marginTop: '32px', textAlign: 'center' }}>
                        <button
                            style={{
                                width: '100%',
                                maxWidth: '320px',
                                padding: '16px 32px',
                                background: 'linear-gradient(90deg, #ec4899 0%, #ef4444 50%, #f97316 100%)',
                                color: 'white',
                                fontWeight: '600',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => setIsResetModalOpen(true)}
                            onMouseOver={(e) => {
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.2)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
                            }}
                        >
                            🔄 Start New Week
                        </button>
                    </div>
                </div>
            </div>

            {/* Reset Modal */}
            {createPortal(
                <CustomModal
                    isOpen={isResetModalOpen}
                    onClose={() => setIsResetModalOpen(false)}
                    title="🔄 Confirm Reset"
                >
                    <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px' }}>
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
                            <button 
                                onClick={() => setIsResetModalOpen(false)} 
                                style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 100%)',
                                    color: '#374151',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleResetWeek} 
                                style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(90deg, #ef4444 0%, #ec4899 100%)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                                }}
                            >
                                Reset Week
                            </button>
                        </div>
                    </div>
                </CustomModal>,
                document.body
            )}

            {/* Add Exercise Modal */}
            {createPortal(
                <AddExerciseModal
                    isOpen={isAddExerciseModalOpen}
                    onClose={handleCloseAddExercise}
                    onAddExercise={handleAddExercise}
                    muscleGroup={selectedDay && workoutPlan ? workoutPlan[selectedDay].name.split(' & ')[0] : ''}
                />,
                document.body
            )}
        </div>
    );
}