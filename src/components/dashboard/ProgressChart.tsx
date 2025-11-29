'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface ProgressData {
  date: string;
  rating: number;
}

interface ProgressChartProps {
  data: ProgressData[];
}

export function ProgressChart({ data }: ProgressChartProps) {
  if (data.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progression</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <svg
            className="w-12 h-12 text-gray-600 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          <p className="text-gray-400">
            Uploadez plus de demos pour voir votre progression
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progression du rating</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  });
                }}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                domain={['auto', 'auto']}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#ff6b00' }}
                formatter={(value: number) => [value.toFixed(2), 'Rating']}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  });
                }}
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="#ff6b00"
                strokeWidth={2}
                dot={{ fill: '#ff6b00', strokeWidth: 0, r: 4 }}
                activeDot={{ fill: '#ff8533', strokeWidth: 0, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
