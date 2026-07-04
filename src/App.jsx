/**
 * Main Application Component
 * Refactored to follow SOLID principles with proper separation of concerns
 */

import React, { useState, useRef, Suspense } from 'react';
import useWorkoutPlan from './hooks/useWorkoutPlan.js';
import useModal from './hooks/useModal.js';
import ProgressBar from './components/ProgressBar';
import DayAccordion from './components/DayAccordion';
import AddExerciseModal from './components/AddExerciseModal';
// Lazy: pulls in emailjs (~80 kB) only when the user actually opens the modal.
const FeedbackModal = React.lazy(() => import('./components/FeedbackModal'));
import LanguageToggle from './components/LanguageToggle';
import UserProfile from './components/UserProfile';
import AuthWrapper from './components/AuthWrapper';
import Modal from './components/ui/Modal.jsx';
import Button from './components/ui/Button.jsx';
import { ButtonVariant } from './components/ui/Button.constants.js';
import { LanguageProvider } from './contexts/LanguageContext';
import { useLanguage } from './hooks/useLanguage.js';
import { AuthProvider } from './contexts/AuthContext';
import { t } from './translations/ui';
import { getToday } from './utils/dateHelper';
import { DAYS_OF_WEEK } from './constants/AppConstants.js';
import mdLogo from './assets/mdlogo.jpeg';

/**
 * Main Application Component Content
 * Focuses solely on UI orchestration, delegating business logic to services and hooks
 * @returns {React.ReactElement} The main app component
 */
function AppContent() {
    const { language } = useLanguage();
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
    const resetDayModal = useModal();
    const addExerciseModal = useModal();
    const feedbackModal = useModal();
    
    // UI state
    const [activeDay, setActiveDay] = useState(getToday());
    const activeDayRef = useRef(null);

    // Scroll active day into view when it changes
    React.useEffect(() => {
        if (activeDayRef.current) {
            activeDayRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [activeDay]);

    // Development helper - expose reset function to console
    React.useEffect(() => {
        if (import.meta.env.DEV) {
            window.resetWorkoutPlan = () => {
                resetWeek();
                console.log('Workout plan reset to default Push/Pull/Leg split');
            };
        }
    }, [resetWeek]);

    /**
     * Event handlers - focused only on UI coordination
     */
    const handleToggleDay = (day) => {
        setActiveDay(activeDay === day ? null : day);
    };

    const handleResetDay = (day) => {
        resetDayModal.open(day);
    };

    const handleConfirmResetDay = () => {
        if (resetDayModal.data) {
            resetDay(resetDayModal.data);
        }
        resetDayModal.close();
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
                    gap: '20px',
                    position: 'relative'
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
                    <div style={{
                        textAlign: 'center',
                        width: '100%'
                    }}>
                        <p style={{
                            color: 'white',
                            fontSize: '16px',
                            margin: '0 0 4px 0',
                            fontWeight: '500'
                        }}>
                            {t("Track your weekly fitness progress", language)}
                        </p>
                        <p style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '14px',
                            margin: '0 0 16px 0',
                            fontWeight: '400'
                        }}>
                            {t("By Jose Mondragon", language)}
                        </p>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            flexWrap: 'wrap'
                        }}>
                            <LanguageToggle />
                            <UserProfile />
                        </div>
                    </div>
                </div>

                {/* Progress Section */}
                <div style={{ 
                    padding: '24px 32px 20px 32px',
                    backgroundColor: 'white'
                }}>
                    <ProgressBar workoutPlan={workoutPlan} language={language} />
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
                                language={language}
                            />
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ 
                        marginTop: '20px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <Button
                            variant={ButtonVariant.DANGER}
                            onClick={resetModal.open}
                            fullWidth
                            style={{ maxWidth: '320px' }}
                        >
                            🔄 {t("Start New Week", language)}
                        </Button>
                        
                        {/* Feedback Button */}
                        <button
                            onClick={feedbackModal.open}
                            style={{
                                width: '100%',
                                maxWidth: '320px',
                                padding: '14px 28px',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.25)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.35)';
                                e.currentTarget.style.background = 'linear-gradient(135deg, #9333ea 0%, #8b5cf6 100%)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 14px rgba(139, 92, 246, 0.25)';
                                e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                            }}
                        >
                            <svg 
                                width="20" 
                                height="20" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                style={{ marginBottom: '1px' }}
                            >
                                <path 
                                    d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span>{t("Share Your Feedback", language)}</span>
                            <span style={{
                                position: 'absolute',
                                top: '8px',
                                right: '12px',
                                background: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontWeight: '700',
                                letterSpacing: '0.5px'
                            }}>
                                BETA
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Reset Modal */}
            <Modal
                isOpen={resetModal.isOpen}
                onClose={resetModal.close}
                title={`🔄 ${t("Confirm Reset", language)}`}
            >
                <p style={{ 
                    marginBottom: '24px', 
                    color: '#6b7280', 
                    fontSize: '16px',
                    lineHeight: '1.6',
                    margin: '0 0 24px 0'
                }}>
                    {t("Are you sure you want to start a new week? This will reset all exercises and progress to the default plan.", language)}
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
                        {t("Cancel", language)}
                    </Button>
                    <Button 
                        variant={ButtonVariant.DANGER}
                        onClick={handleResetWeek}
                        fullWidth
                    >
                        {t("Reset Week", language)}
                    </Button>
                </div>
            </Modal>

            {/* Reset Day Modal */}
            <Modal
                isOpen={resetDayModal.isOpen}
                onClose={resetDayModal.close}
                title={`🔄 ${t("Reset Day", language)}`}
            >
                <p style={{
                    marginBottom: '24px',
                    color: '#6b7280',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    margin: '0 0 24px 0'
                }}>
                    {t("Are you sure you want to reset this day's exercises?", language)}
                </p>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <Button
                        variant={ButtonVariant.SECONDARY}
                        onClick={resetDayModal.close}
                        fullWidth
                    >
                        {t("Cancel", language)}
                    </Button>
                    <Button
                        variant={ButtonVariant.DANGER}
                        onClick={handleConfirmResetDay}
                        fullWidth
                    >
                        {t("Reset Day", language)}
                    </Button>
                </div>
            </Modal>

            {/* Add Exercise Modal */}
            <AddExerciseModal
                isOpen={addExerciseModal.isOpen}
                onClose={addExerciseModal.close}
                onAddExercise={handleAddExercise}
                muscleGroup={addExerciseModal.data && workoutPlan ? workoutPlan[addExerciseModal.data].name.split(' & ')[0] : ''}
                language={language}
            />

            {/* Feedback Modal — code-split, mounted only while open */}
            {feedbackModal.isOpen && (
                <Suspense fallback={null}>
                    <FeedbackModal
                        isOpen={feedbackModal.isOpen}
                        onClose={feedbackModal.close}
                        language={language}
                    />
                </Suspense>
            )}
        </div>
    );
}

/**
 * Main App Component with Providers
 * Wraps the AppContent with all necessary context providers
 * Order: LanguageProvider -> AuthProvider -> AuthWrapper -> AppContent
 */
export default function App() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <AuthWrapper>
                    <AppContent />
                </AuthWrapper>
            </AuthProvider>
        </LanguageProvider>
    );
}