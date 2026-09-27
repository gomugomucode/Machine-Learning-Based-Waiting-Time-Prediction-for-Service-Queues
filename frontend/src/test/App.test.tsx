import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Home } from '../pages/Home';
import { Prediction } from '../pages/Prediction';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import * as api from '../services/api';

vi.spyOn(api, 'getServiceTypes').mockResolvedValue([
  { id: 1, name: 'Cash Transactions', description: 'Deposits and withdrawals', created_at: '2026-09-27' },
]);

describe('Home Page', () => {
  it('renders project title and major project headers', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(
      screen.getByText('Machine Learning-Based Waiting Time Prediction for Service Queues')
    ).toBeInTheDocument();
    expect(screen.getByText('BCA 6th-Semester Major Project')).toBeInTheDocument();
    expect(screen.getByText('View Queue Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Explore Prediction Interface')).toBeInTheDocument();
  });
});

describe('Prediction Page UI & Disclaimer Integrity', () => {
  it('renders prediction interface with mandatory model not connected banner', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Prediction />
        </BrowserRouter>
      );
    });

    expect(screen.getByText('Waiting Time Prediction Engine')).toBeInTheDocument();
    expect(
      screen.getByText('Prediction module — model not yet connected')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no fake prediction results or mock heuristics are displayed/i)
    ).toBeInTheDocument();
  });

  it('displays informational denial notice when submission is attempted', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Prediction />
        </BrowserRouter>
      );
    });

    const button = screen.getByRole('button', { name: /request estimated waiting time/i });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('Inference Denied (Architectural Protocol)')).toBeInTheDocument();
    expect(screen.getByText(/no synthetic prediction was computed/i)).toBeInTheDocument();
  });
});

describe('EmptyState Component', () => {
  it('renders custom title and description', () => {
    render(
      <EmptyState
        title="Custom Empty State"
        description="Detailed empty description message."
      />
    );

    expect(screen.getByText('Custom Empty State')).toBeInTheDocument();
    expect(screen.getByText('Detailed empty description message.')).toBeInTheDocument();
  });
});

describe('Badge Component', () => {
  it('renders badge children with correct styling', () => {
    render(<Badge variant="green">Online</Badge>);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });
});
