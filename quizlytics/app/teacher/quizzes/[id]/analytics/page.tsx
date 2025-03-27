'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface QuizAnalytics {
  quiz: {
    title: string;
    description: string;
    code: string;
  };
  totalAttempts: number;
  averageScore: number;
  averageTimeSpent: number;
  averageEfficiency: number;
  difficultyBreakdown: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
  };
  skippedQuestions: number;
  optionSwitchingData: {
    lowSwitching: number;
    mediumSwitching: number;
    highSwitching: number;
  };
  timeDistribution: {
    label: string;
    count: number;
  }[];
}

export default function QuizAnalytics({ params }: { params: { id: string } }) {
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/teacher/quizzes/${params.id}/analytics`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="container py-8">
        <div className="text-center text-red-500">{error || 'Failed to load analytics'}</div>
      </div>
    );
  }

  const difficultyData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [
      {
        label: 'Correct Answers',
        data: [
          (analytics.difficultyBreakdown.easy.correct / analytics.difficultyBreakdown.easy.total) * 100,
          (analytics.difficultyBreakdown.medium.correct / analytics.difficultyBreakdown.medium.total) * 100,
          (analytics.difficultyBreakdown.hard.correct / analytics.difficultyBreakdown.hard.total) * 100,
        ],
        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)'],
      },
    ],
  };

  const switchingData = {
    labels: ['Low Switching', 'Medium Switching', 'High Switching'],
    datasets: [
      {
        data: [
          analytics.optionSwitchingData.lowSwitching,
          analytics.optionSwitchingData.mediumSwitching,
          analytics.optionSwitchingData.highSwitching,
        ],
        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)'],
      },
    ],
  };

  const timeDistributionData = {
    labels: analytics.timeDistribution.map(d => d.label),
    datasets: [
      {
        label: 'Number of Students',
        data: analytics.timeDistribution.map(d => d.count),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  return (
    <div className="container py-8">
      <h1 className="mb-8">{analytics.quiz.title} - Analytics</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <h3>Total Attempts</h3>
          <p className="mt-2 text-3xl font-bold">{analytics.totalAttempts}</p>
        </div>
        <div className="card">
          <h3>Average Score</h3>
          <p className="mt-2 text-3xl font-bold">{analytics.averageScore.toFixed(1)}%</p>
        </div>
        <div className="card">
          <h3>Average Time</h3>
          <p className="mt-2 text-3xl font-bold">{Math.round(analytics.averageTimeSpent / 60)} min</p>
        </div>
        <div className="card">
          <h3>Skipped Questions</h3>
          <p className="mt-2 text-3xl font-bold">{analytics.skippedQuestions}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4">Performance by Difficulty</h3>
          <Bar
            data={difficultyData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: { display: true, text: 'Correct Answers (%)' },
                },
              },
            }}
          />
        </div>

        <div className="card">
          <h3 className="mb-4">Option Switching Behavior</h3>
          <Pie
            data={switchingData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' },
              },
            }}
          />
        </div>

        <div className="card lg:col-span-2">
          <h3 className="mb-4">Time Distribution</h3>
          <Bar
            data={timeDistributionData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: 'Number of Students' },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
} 