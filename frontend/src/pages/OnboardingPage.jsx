import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { API, authFetch, getApiErrorMessage } from "@/App";

const steps = [
  { id: 1, title: "Ton objectif principal" },
  { id: 2, title: "Combien de minutes par jour ?" },
  { id: 3, title: "Niveau d'énergie le plus fréquent" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({ goal: "", daily_minutes: 10, energy_level: "medium" });

  useEffect(() => {
    const loadState = async () => {
      try {
        const res = await authFetch(`${API}/onboarding/state`);
        if (!res.ok) throw new Error(await getApiErrorMessage(res, "Impossible de charger l'onboarding"));
        const data = await res.json();
        const state = data.onboarding;
        if (state?.completed) {
          navigate("/dashboard");
          return;
        }
        setCurrentStep(state?.current_step || 1);
        setForm((prev) => ({ ...prev, ...(state?.profile || {}) }));
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadState();
  }, [navigate]);

  const submitStep = async () => {
    setSaving(true);
    try {
      const payload =
        currentStep === 1
          ? { goal: form.goal }
          : currentStep === 2
          ? { daily_minutes: Number(form.daily_minutes) }
          : { energy_level: form.energy_level };

      const res = await authFetch(`${API}/onboarding/step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: currentStep, payload }),
      });

      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Échec de la sauvegarde"));

      const data = await res.json();
      if (data.onboarding?.completed) {
        toast.success("Onboarding terminé 🎉");
        navigate("/dashboard");
        return;
      }

      setCurrentStep((s) => Math.min(s + 1, 3));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Onboarding intelligent ({currentStep}/3)</CardTitle>
          <p className="text-sm text-muted-foreground">Plan personnalisé dès aujourd'hui.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {steps.map((s) => (
              <div key={s.id} className={`h-2 flex-1 rounded ${s.id <= currentStep ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>

          {currentStep === 1 && (
            <div className="space-y-2">
              <Label>Quel est ton objectif principal ?</Label>
              <Input
                value={form.goal || ""}
                onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                placeholder="Ex: être plus régulier"
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-2">
              <Label>Combien de minutes par jour peux-tu investir ?</Label>
              <Input
                type="number"
                min={2}
                max={30}
                value={form.daily_minutes || 10}
                onChange={(e) => setForm((f) => ({ ...f, daily_minutes: e.target.value }))}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-2">
              <Label>Niveau d'énergie moyen</Label>
              <div className="flex gap-2">
                {[
                  ["low", "Basse"],
                  ["medium", "Moyenne"],
                  ["high", "Haute"],
                ].map(([k, label]) => (
                  <Button
                    key={k}
                    variant={form.energy_level === k ? "default" : "outline"}
                    onClick={() => setForm((f) => ({ ...f, energy_level: k }))}
                    type="button"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={submitStep} disabled={saving} className="w-full">
            {currentStep === 3 ? "Terminer" : "Continuer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
