"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export interface ConsumptionPoint {
  day: string; // ex: "Lun"
  consommation_kwh: number;
}

export function ConsumptionChart({ data }: { data: ConsumptionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1F2C44" />
        <XAxis dataKey="day" stroke="#8C9BB5" fontSize={12} />
        <YAxis stroke="#8C9BB5" fontSize={12} unit=" kWh" />
        <Tooltip
          contentStyle={{ background: "#121B2E", border: "1px solid #1F2C44", borderRadius: 12 }}
          labelStyle={{ color: "#fff" }}
        />
        <Bar dataKey="consommation_kwh" fill="#2B6CFF" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
