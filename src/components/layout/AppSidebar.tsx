import { Link } from "@tanstack/react-router";
import {
  Activity,
  Dumbbell,
  Home,
  LayoutDashboard,
  PencilLine,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fullName } from "@/lib/domain";
import { useAppStore } from "@/store/app-store";

const NAV = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/resultats", label: "Résultats", icon: LayoutDashboard },
  { to: "/tests", label: "Tests", icon: Activity },
  { to: "/applications", label: "Applications", icon: Dumbbell },
  { to: "/saisie", label: "Saisie", icon: PencilLine },
] as const;

export function AppSidebar() {
  const { athletes, selectedAthlete, selectAthlete, addAthlete, updateAthlete } =
    useAppStore();

  const field = (
    key: "nom" | "prenom" | "age" | "discipline" | "poste" | "pathologie",
    label: string,
    type: "text" | "number" = "text",
  ) => (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Input
        type={type}
        className="h-8 text-sm"
        value={
          type === "number" && Number(selectedAthlete[key]) === 0
            ? ""
            : String(selectedAthlete[key])
        }
        onChange={(event) =>
          updateAthlete(selectedAthlete.id, {
            [key]:
              type === "number" ? Number(event.target.value) : event.target.value,
          })
        }
      />
    </div>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="Logo du cabinet"
              className="h-10 w-10 object-contain"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">Neurocognitive</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Performance sportive
              </p>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 shadow-[var(--shadow-card)]">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-primary/10 data-[status=active]:font-semibold data-[status=active]:text-primary"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <section className="rounded-lg border border-border bg-card px-3 py-3 shadow-[var(--shadow-card)]">
          <div className="grid gap-3 md:grid-cols-[minmax(220px,320px)_1fr]">
            <div className="space-y-1">
              <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Profil sportif
              </Label>
              <div className="flex gap-2">
                <Select value={selectedAthlete.id} onValueChange={selectAthlete}>
                  <SelectTrigger className="h-9 min-w-0 flex-1 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {athletes.map((athlete) => (
                      <SelectItem key={athlete.id} value={athlete.id}>
                        {fullName(athlete).trim() || "Nouveau sportif"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={addAthlete}
                  title="Nouveau sportif"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              {field("prenom", "Prénom")}
              {field("nom", "Nom")}
              {field("age", "Âge", "number")}
              <div className="space-y-1">
                <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Sexe
                </Label>
                <Select
                  value={selectedAthlete.sexe}
                  onValueChange={(value) =>
                    updateAthlete(selectedAthlete.id, {
                      sexe: value as "Homme" | "Femme",
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Homme">Homme</SelectItem>
                    <SelectItem value="Femme">Femme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {field("discipline", "Discipline")}
              {field("poste", "Poste")}
              {field("pathologie", "Pathologie")}
              <div className="space-y-1">
                <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Niveau sportif
                </Label>
                <Input
                  className="h-8 text-sm"
                  value={selectedAthlete.niveau}
                  onChange={(event) =>
                    updateAthlete(selectedAthlete.id, { niveau: event.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </header>
  );
}
