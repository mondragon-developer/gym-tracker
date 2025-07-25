import React from 'react';
import { t } from '../translations/ui';

/**
 * Displays the user's weekly workout progress.
 */
const ProgressBar = ({ workoutPlan, language = 'en' }) => {
    const [total, completed] = React.useMemo(() => {
        let totalExercises = 0;
        let completedOrSkipped = 0;
        Object.values(workoutPlan).forEach(day => {
            totalExercises += day.exercises.length;
            day.exercises.forEach(ex => {
                if (ex.status === 'completed' || ex.status === 'skipped') {
                    completedOrSkipped++;
                }
            });
        });
        return [totalExercises, completedOrSkipped];
    }, [workoutPlan]);

    const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div style={{
            marginBottom: '32px',
            padding: '32px',
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)',
            borderRadius: '16px',
            border: '2px solid #10b981',
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.15)'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(90deg, #047857 0%, #059669 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '8px',
                    margin: '0 0 8px 0'
                }}>
                    📊 {t("Weekly Progress", language)}
                </h2>
                <p style={{
                    fontSize: '16px',
                    color: '#374151',
                    fontWeight: '500',
                    margin: '0'
                }}>
                    {completed} {t("of", language)} {total} {t("exercises", language)} {t("completed", language)}
                </p>
            </div>
            
            <div style={{
                background: 'linear-gradient(90deg, #e5e7eb 0%, #d1d5db 100%)',
                borderRadius: '20px',
                height: '40px',
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                border: '2px solid #9ca3af',
                position: 'relative'
            }}>
                <div
                    style={{
                        background: 'linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%)',
                        height: '100%',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        transition: 'width 1s ease-out',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                        width: `${progressPercentage}%`
                    }}
                >
                    {progressPercentage > 15 && `${progressPercentage}%`}
                </div>
            </div>
            
            {progressPercentage <= 15 && (
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <span style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(90deg, #047857 0%, #059669 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        {progressPercentage}%
                    </span>
                </div>
            )}
            
            {progressPercentage === 100 && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '12px 24px',
                        borderRadius: '20px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)',
                        animation: 'pulse 2s infinite'
                    }}>
                        🎉 {t("Week Complete!", language)} 🎉
                    </span>
                </div>
            )}
            
            {progressPercentage >= 75 && progressPercentage < 100 && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '8px 16px',
                        borderRadius: '16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        background: 'linear-gradient(90deg, #60a5fa 0%, #a855f7 100%)',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(96, 165, 250, 0.3)'
                    }}>
                        🔥 {t("Almost there!", language)}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ProgressBar;