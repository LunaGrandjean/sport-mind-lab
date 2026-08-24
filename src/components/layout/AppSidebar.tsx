import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Home,
  Activity,
  Dumbbell,
  PencilLine,
} from "lucide-react";

import logo from "@/assets/logo.jpeg.asset.json";
import { useAppStore } from "@/store/app-store";
import { fullName } from "@/lib/domain";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NAV = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/resultats", label: "Résultats / Dashboard", icon: LayoutDashboard },
  { to: "/tests", label: "Tests", icon: Activity },
  { to: "/applications", label: "Applications de travail", icon: Dumbbell },
  { to: "/saisie", label: "Saisie manuelle", icon: PencilLine },
] as const;

export function AppSidebar() {
  const { athletes, selectedAthlete, selectAthlete, updateAthlete } = useAppStore();

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
        value={String(selectedAthlete[key])}
        onChange={(e) =>
          updateAthlete(selectedAthlete.id, {
            [key]: type === "number" ? Number(e.target.value) : e.target.value,
          })
        }
      />
    </div>
  );

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
        <img src={logo.url} alt="Logo du cabinet" className="h-9 w-9 object-contain" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-sidebar-foreground">
            Neurocognitive
          </p>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Performance sportive
          </p>
        </div>
      </div>

      <nav className="space-y-0.5 border-b border-sidebar-border p-2">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent data-[status=active]:bg-sidebar-accent data-[status=active]:font-medium data-[status=active]:text-primary"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Profil sportif
          </Label>
          <Select value={selectedAthlete.id} onValueChange={selectAthlete}>
            <SelectTrigger className="h-9 w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {athletes.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {fullName(a)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {field("prenom", "Prénom")}
          {field("nom", "Nom")}
          {field("age", "Âge", "number")}
          <div className="space-y-1">
            <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Sexe
            </Label>
            <Select
              value={selectedAthlete.sexe}
              onValueChange={(v) =>
                updateAthlete(selectedAthlete.id, { sexe: v as "Homme" | "Femme" })
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
            onChange={(e) =>
              updateAthlete(selectedAthlete.id, { niveau: e.target.value })
            }
          />
        </div>
      </div>
    </aside>
  );
}
