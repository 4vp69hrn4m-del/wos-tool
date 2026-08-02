"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TimeSlot = { id: number; label: string };
type ParticipantSlot = { timeSlotId: number; timeSlot: { id: number; label: string } };
type Participant = {
  id: number;
  playerName: string;
  alliance: string | null;
  hasT12: boolean;
  t12ShieldSkill: number | null;
  t12SpearSkill: number | null;
  t12BowSkill: number | null;
  timeSlots: ParticipantSlot[];
};
type SvsRound = {
  id: number;
  roundName: string;
  status: string | null;
  timeSlots: TimeSlot[];
  participants: Participant[];
};

const presetOrder = ["21:00〜23:00", "23:00〜01:00", "01:00〜02:00"];

export default function Home() {
  const [latestRound, setLatestRound] = useState<SvsRound | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const list = await fetch("/api/svs-rounds").then((r) => r.json());
      if (list.length === 0) {
        setLoading(false);
        return;
      }
      const detail = await fetch(`/api/svs-roun
