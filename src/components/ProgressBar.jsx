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
            background: 'var(--done-soft)',
            borderRadius: '16px',
            border: '2px solid var(--done-border)',
            boxShadow: '0 8px 25px var(--shadow)'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: 'var(--done)',
                    marginBottom: '8px',
                    margin: '0 0 8px 0'
                }}>
                    📊 {t("Weekly Progress", language)}
                </h2>
                <p style={{
                    fontSize: '16px',
                    color: 'var(--text-2)',
                    fontWeight: '500',
                    margin: '0'
                }}>
                    {completed} {t("of", language)} {total} {t("exercises", language)} {t("completed", language)}
                </p>
            </div>
            
            <div style={{
                background: 'var(--surface-3)',
                borderRadius: '20px',
                height: '40px',
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 4px var(--shadow)',
                border: '2px solid var(--border-strong)',
                position: 'relative'
            }}>
                <div
                    style={{
                        background: 'var(--done)',
                        height: '100%',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-inverse)',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        transition: 'width 1s ease-out',
                        boxShadow: '0 2px 8px var(--shadow)',
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
                        color: 'var(--done)'
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
                        background: 'var(--done-soft)',
                        color: 'var(--done)',
                        border: '1px solid var(--done-border)',
                        boxShadow: '0 4px 12px var(--shadow)',
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
                        background: 'var(--info-soft)',
                        color: 'var(--info)',
                        border: '1px solid var(--info-border)',
                        boxShadow: '0 2px 8px var(--shadow)'
                    }}>
                        🔥 {t("Almost there!", language)}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ProgressBar;