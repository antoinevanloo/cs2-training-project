'use client';

import { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ProgressData {
  date: string;
  rating: number;
}

interface ProgressChartContentProps {
  data: ProgressData[];
}

export const ProgressChartContent = memo(function ProgressChartContent({
  data,
}: ProgressChartContentProps) {
  return (
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
  );
});