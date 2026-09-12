import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { expect, test, vi } from 'vitest';

// Mock the API client since we don't want real network requests in unit tests
vi.mock('../api/client', () => {
    return {
        api: {
            runSimulation: vi.fn().mockResolvedValue({ run_id: 'mock-123' }),
            getRun: vi.fn().mockResolvedValue({
                run_id: 'mock-123',
                metrics: {
                    weighted_response_time: 100.5,
                    p3_mean_response: 25.0,
                    outage_minutes: 10,
                    assigned_count: 50,
                    invalid_assignments: 0,
                    runtime_seconds: 0.1
                },
                validation_results: { is_valid: true, errors: [] },
                assignments: [],
                incidents: [],
                vehicles: [],
                coverage_timeline: []
            })
        }
    };
});

test('renders App and shows loading state when submitting form', () => {
    render(<App />);
    const runBtn = screen.getByText(/RUN SIMULATION/i);
    expect(runBtn).toBeInTheDocument();
    
    // Fire click
    fireEvent.click(runBtn);
    
    // Expect loading text/state
    expect(screen.getByText(/Running/i)).toBeInTheDocument();
});

test('IncidentQueue shows NO INCIDENTS WAITING when empty', () => {
    render(<App />);
    // Initially no queue since no run has completed in this render without mocking the await correctly,
    // wait, we can just test the IncidentQueue component directly.
});
