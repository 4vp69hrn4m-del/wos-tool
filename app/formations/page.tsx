"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Formation = {
  id: number;
  label: string | null;
  side: string;
  formationType: string | null;
  shieldHeroName: string | null;
  spearHeroName: string | null;
  bowHeroName: string | null;
  expertName: string | null;
  petName: string | null;
  infantryPct: number | null;
  cavalryPct: number | null;
  archerPct: number | null;
  equipmentNote: string | null;
  createdAt: string;
};

type Hero = { id: number; name: string; troopType: string };
type Expert = { id: number; name: string };
type Pet = { id: number; name: string };

const emptyForm = {
  label: "",
  side: "self",
  formationType: "attack",
  shieldHeroName: "",
  spearHeroName: "",
  bowHeroName: "",
  expertName: "",
  petName: "",
  infantryPct: "",
  cavalryPct: "",
  archerPct: "",
  equipmentNote: "",
};

export default function FormationsPage() {
  const [form, setForm] = useState(emptyForm);
  const [list, setList] = useState<Formation[]>([]);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadAll() {
    const [f, h, e, p] = await Promise.all([
      fetch("/api/formations").then((r) => r.json()),
      fetch("/api/heroes").then((r) => r.json()),
      fetch("/api/experts").then((r) => r.json()),
      fetch("/api/pets").then((r) => r.json()),
    ]);
    setList(f);
    setHeroes(h);
    setExperts(e);
    setPets(p);
  }

  use
