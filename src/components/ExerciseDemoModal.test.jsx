import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExerciseDemoModal from './ExerciseDemoModal.jsx';

afterEach(() => vi.unstubAllGlobals());
const exercise = { dbId: 247, name: 'Power Clean' };

describe('GIF exercise demos', () => {
  it('pauses on a still poster and resumes the GIF', async () => {
    render(<ExerciseDemoModal exercise={exercise} onClose={() => {}} />);
    const image = screen.getByRole('img', { name: 'Power Clean' });
    expect(image.src).toMatch(/247.gif$/);
    fireEvent.click(screen.getByRole('button', { name: 'Pause demo' }));
    expect(image.src).toMatch(/247.jpg$/);
    fireEvent.click(screen.getByRole('button', { name: 'Play demo' }));
    expect(image.src).toMatch(/247.gif$/);
    expect(screen.getByRole('link', { name: 'Download GIF' })).toHaveAttribute('download');
    expect(await screen.findByText(/Data: free-exercise-db/)).toBeInTheDocument();
  });

  it('starts paused for reduced motion and loads Spanish instructions', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    render(<ExerciseDemoModal exercise={exercise} language="es" onClose={() => {}} />);
    expect(screen.getByRole('img', { name: 'Cargada de potencia' }).src).toMatch(/247.jpg$/);
    expect(screen.getByRole('button', { name: 'Reproducir demo' })).toBeInTheDocument();
    expect(await screen.findByText(/Parte con la barra en el suelo/)).toBeInTheDocument();
  });

  it('keeps instructions available if the image cannot load', async () => {
    render(<ExerciseDemoModal exercise={exercise} onClose={() => {}} />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('status')).toHaveTextContent('The demo could not load');
    expect(await screen.findByText('How to perform')).toBeInTheDocument();
  });
});
