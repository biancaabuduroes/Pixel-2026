"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BottomSheet } from "@/components/ds/bottom-sheet";
import { TextField } from "@/components/ds/text-field";
import { Button } from "@/components/ui/button";
import { updateBuyerProfileAction } from "@/server/actions/buyer";

/** B5.1a Edit profile. Email is shown read-only; name and phone live in preferences. */
export function EditProfileSheet({
  open,
  onOpenChange,
  email,
  firstName,
  lastName,
  phone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const router = useRouter();
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [tel, setTel] = useState(phone);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateBuyerProfileAction({ firstName: first, lastName: last, phone: tel });
      if (!result.ok) {
        setError("Verifică prenumele și încearcă din nou.");
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Editează profilul" header="left">
      <TextField label="Prenume" value={first} onChange={(e) => setFirst(e.target.value)} />
      <TextField label="Nume" value={last} onChange={(e) => setLast(e.target.value)} />
      <TextField label="Telefon" value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" />
      <TextField label="Email" value={email} readOnly disabled />
      {error && <p className="body-sm text-text-danger">{error}</p>}
      <Button className="w-full" disabled={pending || first.trim().length === 0} onClick={save}>
        {pending ? "Se salvează…" : "Salvează"}
      </Button>
    </BottomSheet>
  );
}
