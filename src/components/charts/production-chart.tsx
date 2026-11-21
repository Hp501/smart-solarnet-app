"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export interface ProductionPoint {
  time: string; // ex: "14:00"
  solaire: number;
  eolienne?: number;
}

export function ProductionChart({ data }: { data: ProductionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5B93F" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#F5B93F" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1F2C44" />
        <XAxis dataKey="time" stroke="#8C9BB5" fontSize={12} />
        <YAxis stroke="#8C9BB5" fontSize={12} unit=" W" />
        <Tooltip
          contentStyle={{ background: "#121B2E", border: "1px solid #1F2C44", borderRadius: 12 }}
          labelStyle={{ color: "#fff" }}
        />
        <Area type="monotone" dataKey="solaire" stroke="#F5B93F" fill="url(#solarGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
