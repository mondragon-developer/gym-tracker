import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from './ProgressBar.jsx';

const makePlan = (statuses) => ({
  Monday: {
    name: 'Test',
    exercises: statuses.map((status, i) => ({ id: `${i}`, status })),
  },
});

describe('ProgressBar', () => {
  it('shows 0% with an empty plan', () => {
    render(<ProgressBar workoutPlan={{ Monday: { exercises: [] } }} language="en" />);
    expect(screen.getByText(/Weekly Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/0 of 0/)).toBeInTheDocument();
  });

  it('counts completed and skipped together as progressed', () => {
    const plan = makePlan(['completed', 'skipped', 'incomplete', 'incomplete']);
    render(<ProgressBar workoutPlan={plan} language="en" />);
    expect(screen.getByText(/2 of 4/)).toBeInTheDocument();
  });

  it('renders the celebratory state at 100%', () => {
    const plan = makePlan(['completed', 'completed', 'completed']);
    render(<ProgressBar workoutPlan={plan} language="en" />);
    expect(screen.getByText(/Week Complete/i)).toBeInTheDocument();
  });

  it('shows the "Almost there" badge between 75% and 99%', () => {
    const plan = makePlan(['completed', 'completed', 'completed', 'incomplete']);
    render(<ProgressBar workoutPlan={plan} language="en" />);
    expect(screen.getByText(/Almost there/i)).toBeInTheDocument();
  });

  it('translates progress copy when language=es', () => {
    const plan = makePlan(['completed', 'incomplete']);
    render(<ProgressBar workoutPlan={plan} language="es" />);
    expect(screen.getByText(/Progreso Semanal/i)).toBeInTheDocument();
    expect(screen.getByText(/de/)).toBeInTheDocument();
  });
});
