import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  User,
  Lock,
  LogOut,
  Globe,
  Moon,
  Sun,
  Bell,
  Download,
  Upload,
  Wifi,
  WifiOff,
  Database,
  Trash2,
  Plus,
  Loader2,
  Flame,
  Award,
  MapPin,
  ListRestart,
  ShieldAlert,
  Edit2,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, signOut } = useAuth();
  const { mode, setMode } = useTheme();
  const { lang, setLang, t } = useI18n();

  // Local translations override/dictionary to keep i18n extensible
  const localT = useMemo(() => {
    return {
      it: {
        online: "Online",
        offline: "Offline",
        profile: "Profilo",
        preferences: "Preferenze",
        notifications: "Notifiche",
        dataBackup: "Backup Dati",
        skatingLists: "Liste Skating",
        dangerZone: "Zona Pericolo",
        displayName: "Nome Visualizzato",
        displayNamePlaceholder: "Inserisci il tuo nome",
        updateProfile: "Aggiorna Profilo",
        avatarTitle: "Immagine del Profilo",
        avatarUploading: "Caricamento in corso...",
        avatarUploadSuccess: "Avatar aggiornato!",
        securityTitle: "Sicurezza & Password",
        newPassword: "Nuova Password",
        confirmPassword: "Conferma Password",
        changePassword: "Cambia Password",
        passwordsDoNotMatch: "Le password non corrispondono",
        passwordMinLength: "La password deve contenere almeno 6 caratteri",
        passwordChangedSuccess: "Password modificata con successo!",
        logoutTitle: "Disconnetti",
        logoutConfirm: "Sei sicuro di voler uscire dalla sessione corrente?",
        logoutButton: "Esci",
        themeTitle: "Tema dell'Applicazione",
        themeDesc: "Scegli l'aspetto grafico che preferisci",
        themeLight: "Chiaro",
        themeDark: "Scuro",
        themeAuto: "Sistema",
        langTitle: "Lingua dell'Applicazione",
        langDesc: "Seleziona la lingua per l'interfaccia utente",
        notifGeneral: "Notifiche Attive",
        notifGeneralDesc: "Abilita o disabilita tutte le notifiche del sistema.",
        notifHabits: "Promemoria Abitudini",
        notifHabitsDesc: "Ricevi notifiche per ricordarti di completare le tue abitudini quotidiane.",
        notifSummary: "Riepilogo Serale",
        notifSummaryDesc: "Ricevi una notifica di riassunto della tua giornata all'orario indicato.",
        notifTime: "Orario del riepilogo",
        exportTitle: "Esporta i tuoi dati",
        exportDesc: "Scarica un file JSON completo contenente abitudini, note e allenamenti skating.",
        exportButton: "Scarica Backup JSON",
        importTitle: "Importa i tuoi dati",
        importDesc: "Carica un file di backup JSON precedentemente esportato per ripristinare i tuoi dati.",
        importButton: "Seleziona File & Ripristina",
        importSuccess: "Dati importati e ripristinati con successo!",
        importFailed: "Impossibile importare il file di backup.",
        skatingElements: "Elementi Skating",
        skatingLocations: "Luoghi Skating",
        skatingTypes: "Tipi Sessione",
        addElement: "Aggiungi Elemento",
        addLocation: "Aggiungi Luogo",
        addType: "Aggiungi Tipo",
        saved: "Salvato",
        delete: "Eliminato",
        dangerZoneTitle: "Zona Pericolosa",
        dangerZoneDesc: "Queste azioni sono distruttive e irreversibili. Procedi con estrema cautela.",
        deleteDataTitle: "Elimina Tutti i Dati",
        deleteDataDesc: "Rimuovi permanentemente tutti i tuoi dati da SkateTrack (Abitudini, Note, Skating, Impostazioni).",
        deleteDataButton: "Elimina Tutto Permanentemente",
        doubleConfirmTitle: "Conferma Eliminazione Totale",
        doubleConfirmDesc: "Questa operazione eliminerà definitivamente TUTTI i tuoi dati. Non sarà possibile recuperarli in alcun modo.",
        doubleConfirmPrompt: 'Digita la parola "ELIMINA" in maiuscolo nel campo sottostante per sbloccare l\'eliminazione definitiva.',
        wipeSuccess: "Tutti i tuoi dati sono stati eliminati permanentemente.",
        updating: "Aggiornamento in corso...",
      },
      en: {
        online: "Online",
        offline: "Offline",
        profile: "Profile",
        preferences: "Preferences",
        notifications: "Notifications",
        dataBackup: "Data Backup",
        skatingLists: "Skating Lists",
        dangerZone: "Danger Zone",
        displayName: "Display Name",
        displayNamePlaceholder: "Enter your name",
        updateProfile: "Update Profile",
        avatarTitle: "Profile Picture",
        avatarUploading: "Uploading...",
        avatarUploadSuccess: "Avatar updated!",
        securityTitle: "Security & Password",
        newPassword: "New Password",
        confirmPassword: "Confirm Password",
        changePassword: "Change Password",
        passwordsDoNotMatch: "Passwords do not match",
        passwordMinLength: "Password must be at least 6 characters long",
        passwordChangedSuccess: "Password changed successfully!",
        logoutTitle: "Log Out",
        logoutConfirm: "Are you sure you want to end your current session?",
        logoutButton: "Log Out",
        themeTitle: "Application Theme",
        themeDesc: "Choose your preferred interface style",
        themeLight: "Light",
        themeDark: "Dark",
        themeAuto: "System",
        langTitle: "Application Language",
        langDesc: "Select the language for the user interface",
        notifGeneral: "Notifications Enabled",
        notifGeneralDesc: "Enable or disable all system notifications.",
        notifHabits: "Habit Reminders",
        notifHabitsDesc: "Receive alerts reminding you to complete your daily habits.",
        notifSummary: "Evening Summary",
        notifSummaryDesc: "Receive a summary notification of your day at the specified time.",
        notifTime: "Summary Time",
        exportTitle: "Export your data",
        exportDesc: "Download a full JSON file containing habits, notes, and skating practices.",
        exportButton: "Download JSON Backup",
        importTitle: "Import your data",
        importDesc: "Upload a previously exported JSON backup file to restore your data.",
        importButton: "Select File & Restore",
        importSuccess: "Data imported and restored successfully!",
        importFailed: "Failed to import backup file.",
        skatingElements: "Skating Elements",
        skatingLocations: "Skating Locations",
        skatingTypes: "Session Types",
        addElement: "Add Element",
        addLocation: "Add Location",
        addType: "Add Type",
        saved: "Saved",
        delete: "Deleted",
        dangerZoneTitle: "Dangerous Zone",
        dangerZoneDesc: "These actions are destructive and irreversible. Proceed with extreme caution.",
        deleteDataTitle: "Delete All Data",
        deleteDataDesc: "Permanently remove all your data from SkateTrack (Habits, Notes, Skating, Settings).",
        deleteDataButton: "Delete Everything Permanently",
        doubleConfirmTitle: "Confirm Total Deletion",
        doubleConfirmDesc: "This operation will permanently delete ALL your data. There is absolutely no way to recover them.",
        doubleConfirmPrompt: 'Type the word "ELIMINA" in uppercase in the input field below to unlock permanent deletion.',
        wipeSuccess: "All of your data has been permanently deleted.",
        updating: "Updating...",
      },
    }[lang];
  }, [lang]);

  // Online / Offline State Tracker
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Profile data query
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) {
        // Fallback profile object if table row is missing/lagged
        return { id: user.id, display_name: user.email?.split("@")[0] || "", avatar_url: null };
      }
      return data;
    },
    enabled: !!user,
  });

  const profile = profileQuery.data;

  // Profile mutation (Display Name & optional Avatar URL)
  const [displayNameInput, setDisplayNameInput] = useState("");
  useEffect(() => {
    if (profile?.display_name) {
      setDisplayNameInput(profile.display_name);
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (vars: { display_name: string; avatar_url?: string | null }) => {
      if (!user) throw new Error("Unauthenticated");
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: vars.display_name,
        ...(vars.avatar_url !== undefined ? { avatar_url: vars.avatar_url } : {}),
      });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success(`${vars.display_name} — ${t("saved")}`);
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Avatar Upload logic
  const [avatarUploading, setAvatarUploading] = useState(false);
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setAvatarUploading(true);
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`;

      // Upload file directly using Supabase client to storage bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtain public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Save public URL in profile
      await updateProfile.mutateAsync({
        display_name: displayNameInput || user.email?.split("@")[0] || "",
        avatar_url: publicUrl,
      });

      // Also save in user_settings table for absolute sync
      await supabase.from("user_settings").upsert({
        user_id: user.id,
        avatar_url: publicUrl,
      });

      toast.success(localT.avatarUploadSuccess);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  // Password alteration
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(localT.passwordsDoNotMatch);
      return;
    }
    if (newPassword.length < 6) {
      toast.error(localT.passwordMinLength);
      return;
    }

    try {
      setPasswordLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(localT.passwordChangedSuccess);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Settings custom settings query
  const settingsQuery = useQuery({
    queryKey: ["user_settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single();
      if (error) {
        // Auto-initialize standard default user_settings if record was missing
        const defaults = {
          user_id: user.id,
          theme: "dark",
          language: "it",
          notifications_enabled: true,
          habit_notifications: true,
          evening_summary: false,
          evening_time: "21:00",
          avatar_url: null,
        };
        await supabase.from("user_settings").insert(defaults);
        return defaults;
      }
      return data;
    },
    enabled: !!user,
  });

  const appSettings = settingsQuery.data;

  // Preferences mutator
  const updateSettings = useMutation({
    mutationFn: async (updated: Partial<typeof appSettings>) => {
      if (!user) throw new Error("Unauthenticated");
      const { error } = await supabase.from("user_settings").upsert({
        user_id: user.id,
        ...updated,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_settings", user?.id] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  // Handle local Theme/Lang change with Sync trigger to database
  const changeThemeMode = (themeMode: "light" | "dark" | "auto") => {
    setMode(themeMode);
    updateSettings.mutate({ theme: themeMode });
    toast.success(`${localT.themeTitle} -> ${themeMode}`);
  };

  const changeLanguage = (language: "it" | "en") => {
    setLang(language);
    updateSettings.mutate({ language });
    toast.success(`${localT.langTitle} -> ${language === "it" ? "Italiano" : "English"}`);
  };

  // Export database data to single JSON backup
  const handleExport = async () => {
    try {
      toast.loading("Exporting...");
      const tables = [
        "habits",
        "habit_completions",
        "notes",
        "skating_sessions",
        "skating_session_elements",
        "skating_elements",
        "skating_locations",
        "skating_session_types",
      ];

      const backupData: Record<string, any> = {
        version: 1,
        exported_at: new Date().toISOString(),
        user_id: user?.id,
      };

      for (const tName of tables) {
        const { data, error } = await supabase.from(tName).select("*");
        if (error) throw error;
        backupData[tName] = data || [];
      }

      const content = JSON.stringify(backupData, null, 2);
      const filename = `skatetrack_backup_${new Date().toISOString().split("T")[0]}.json`;
      toast.dismiss();
      if (navigator.share) {
        try {
          await navigator.share({ title: "SkateTrack Backup", text: content.substring(0, 50000) });
          return;
        } catch (_) {}
      }
      try {
        await navigator.clipboard.writeText(content);
        toast.success("JSON copiato negli appunti!");
      } catch (_) {
        const blob = new Blob([content], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("JSON backup downloaded!");
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error("Export failure: " + err.message);
    }
  };

  // Import JSON backup data
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      toast.loading("Importing backup...");
      const fileText = await file.text();
      const backupObj = JSON.parse(fileText);

      if (!backupObj.exported_at && !backupObj.version) {
        throw new Error("Backup file is not recognized format.");
      }

      // Foreign key sequential dependency processing
      const syncOrder = [
        "habits",
        "notes",
        "skating_elements",
        "skating_locations",
        "skating_session_types",
        "skating_sessions",
        "habit_completions",
        "skating_session_elements",
      ];

      for (const tName of syncOrder) {
        const rows = backupObj[tName];
        if (!rows || !Array.isArray(rows) || rows.length === 0) continue;

        const mappedRows = rows.map((r: any) => ({ ...r, user_id: user.id }));
        const { error } = await supabase.from(tName).upsert(mappedRows);
        if (error) throw new Error(`Table ${tName}: ${error.message}`);
      }

      toast.dismiss();
      toast.success(localT.importSuccess);
      qc.invalidateQueries();
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message);
    } finally {
      e.target.value = "";
    }
  };

  // CRUDS: Skating elements
  const elementsQuery = useQuery({
    queryKey: ["skating_elements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skating_elements").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const [newElementName, setNewElementName] = useState("");
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingElementName, setEditingElementName] = useState("");

  const addElementMutation = useMutation({
    mutationFn: async () => {
      if (!user || !newElementName.trim()) return;
      const { error } = await supabase.from("skating_elements").insert({
        user_id: user.id,
        name: newElementName.trim(),
        archived: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewElementName("");
      qc.invalidateQueries({ queryKey: ["skating_elements"] });
      toast.success(localT.saved);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateElementMutation = useMutation({
    mutationFn: async (vars: { id: string; name?: string; archived?: boolean }) => {
      const { error } = await supabase.from("skating_elements").update({
        ...(vars.name !== undefined ? { name: vars.name } : {}),
        ...(vars.archived !== undefined ? { archived: vars.archived } : {}),
      }).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingElementId(null);
      qc.invalidateQueries({ queryKey: ["skating_elements"] });
      toast.success(localT.saved);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteElementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skating_elements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skating_elements"] });
      toast.success(localT.delete);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // CRUDS: Skating Locations
  const locationsQuery = useQuery({
    queryKey: ["skating_locations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skating_locations").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const [newLocationName, setNewLocationName] = useState("");
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editingLocationName, setEditingLocationName] = useState("");

  const addLocationMutation = useMutation({
    mutationFn: async () => {
      if (!user || !newLocationName.trim()) return;
      const { error } = await supabase.from("skating_locations").insert({
        user_id: user.id,
        name: newLocationName.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewLocationName("");
      qc.invalidateQueries({ queryKey: ["skating_locations"] });
      toast.success(localT.saved);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (vars: { id: string; name: string }) => {
      const { error } = await supabase.from("skating_locations").update({ name: vars.name }).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingLocationId(null);
      qc.invalidateQueries({ queryKey: ["skating_locations"] });
      toast.success(localT.saved);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skating_locations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skating_locations"] });
      toast.success(localT.delete);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // CRUDS: Skating Session Types
  const typesQuery = useQuery({
    queryKey: ["skating_types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skating_session_types").select("*").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const [newTypeName, setNewTypeName] = useState("");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState("");

  const addTypeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !newTypeName.trim()) return;
      const { error } = await supabase.from("skating_session_types").insert({
        user_id: user.id,
        name: newTypeName.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewTypeName("");
      qc.invalidateQueries({ queryKey: ["skating_types"] });
      toast.success(localT.saved);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateTypeMutation = useMutation({
    mutationFn: async (vars: { id: string; name: string }) => {
      const { error } = await supabase.from("skating_session_types").update({ name: vars.name }).eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingTypeId(null);
      qc.invalidateQueries({ queryKey: ["skating_types"] });
      toast.success(localT.saved);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skating_session_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["skating_types"] });
      toast.success(localT.delete);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Safe Wipe data system ("ELIMINA" double safety)
  const [confirmWipeInput, setConfirmWipeInput] = useState("");
  const [wipeLoading, setWipeLoading] = useState(false);

  const handleWipeAllData = async () => {
    if (!user || confirmWipeInput !== "ELIMINA") return;
    try {
      setWipeLoading(true);
      toast.loading(localT.updating);

      // Cascading deletion by sequential manual query respect tables dependency
      const wipeOrder = [
        "skating_session_elements",
        "skating_sessions",
        "skating_elements",
        "skating_locations",
        "skating_session_types",
        "notes",
        "habit_completions",
        "habits",
      ];

      for (const tName of wipeOrder) {
        const { error } = await supabase.from(tName).delete().eq("user_id", user.id);
        if (error) throw error;
      }

      // Reset profile defaults
      await supabase.from("profiles").upsert({
        id: user.id,
        display_name: user.email?.split("@")[0] || "",
        avatar_url: null,
      });

      // Reset user settings defaults
      await supabase.from("user_settings").upsert({
        user_id: user.id,
        theme: "dark",
        language: "it",
        notifications_enabled: true,
        habit_notifications: true,
        evening_summary: false,
        evening_time: "21:00",
        avatar_url: null,
        updated_at: new Date().toISOString(),
      });

      toast.dismiss();
      toast.success(localT.wipeSuccess);
      qc.clear();
      setConfirmWipeInput("");
      
      // Auto SignOut on full data wipe
      await signOut();
      navigate({ to: "/login" });
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message);
    } finally {
      setWipeLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Settings Top Title & Live network badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-5">
        <div>
          <p className="text-xs font-bold tracking-widest text-primary uppercase">SkateTrack</p>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
            {localT.preferences}
          </h1>
        </div>

        {/* Dynamic connection indicator badge */}
        <Badge
          variant={isOnline ? "outline" : "destructive"}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all duration-300 ${
            isOnline
              ? "border-primary/20 bg-primary/10 text-primary shadow-[0_0_12px_rgba(var(--color-primary),0.15)]"
              : "bg-destructive/10 border-destructive/20 text-destructive shadow-[0_0_12px_rgba(239,68,68,0.15)]"
          }`}
        >
          {isOnline ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <Wifi className="h-3.5 w-3.5" />
              {localT.online}
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              </span>
              <WifiOff className="h-3.5 w-3.5" />
              {localT.offline}
            </>
          )}
        </Badge>
      </div>

      {/* Main glassmorphism container */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Tabs defaultValue="profile" className="md:col-span-4 space-y-6">
          <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 h-auto p-1 bg-card/60 backdrop-blur-xl border border-border/40 rounded-xl">
            <TabsTrigger value="profile" className="py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{localT.profile}</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
              <Sun className="h-4 w-4" />
              <span className="hidden sm:inline">{localT.preferences}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{localT.notifications}</span>
            </TabsTrigger>
            <TabsTrigger value="skating" className="py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">Skating</span>
            </TabsTrigger>
            <TabsTrigger value="backup" className="py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Backup</span>
            </TabsTrigger>
            <TabsTrigger value="danger" className="py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 text-destructive data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">
              <ShieldAlert className="h-4 w-4" />
              <span className="hidden sm:inline">Danger</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile & Avatar Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Avatar upload card */}
              <Card className="bg-card/40 border-border/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {localT.avatarTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
                  <div className="relative group">
                    <Avatar className="h-28 w-28 border-2 border-border shadow-xl transition-all duration-300 group-hover:scale-105">
                      <AvatarImage src={profile?.avatar_url || ""} alt={profile?.display_name || user?.email} className="object-cover" />
                      <AvatarFallback className="bg-muted text-foreground text-3xl font-bold uppercase">
                        {(profile?.display_name || user?.email || "U").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Fancy hover overlay */}
                    <label
                      htmlFor="avatar-file-input"
                      className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    >
                      <Edit2 className="h-6 w-6 text-white" />
                    </label>
                  </div>

                  <input
                    id="avatar-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={avatarUploading}
                    className="hidden"
                  />

                  {avatarUploading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>{localT.avatarUploading}</span>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" asChild className="cursor-pointer">
                      <label htmlFor="avatar-file-input">Carica Foto</label>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Profile Details (Display Name) card */}
              <Card className="md:col-span-2 bg-card/40 border-border/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">{localT.profile}</CardTitle>
                  <CardDescription>Gestisci le tue informazioni personali ed email.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="user-email">Email</Label>
                    <Input id="user-email" type="email" value={user?.email || ""} disabled className="bg-muted/50 text-muted-foreground" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="display-name-input">{localT.displayName}</Label>
                    <Input
                      id="display-name-input"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder={localT.displayNamePlaceholder}
                      className="bg-background/40"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    onClick={() => updateProfile.mutate({ display_name: displayNameInput })}
                    disabled={updateProfile.isPending}
                    className="font-semibold text-primary-foreground shadow-md bg-gradient-to-r from-primary to-emerald-400 hover:opacity-90 border-0"
                  >
                    {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {localT.updateProfile}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Password edit & Session control */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reset Password card */}
              <Card className="bg-card/40 border-border/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    {localT.securityTitle}
                  </CardTitle>
                </CardHeader>
                <form onSubmit={handlePasswordChange}>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-password">{localT.newPassword}</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="bg-background/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-password">{localT.confirmPassword}</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-background/40"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={passwordLoading} variant="outline" className="border-border hover:bg-muted font-semibold">
                      {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {localT.changePassword}
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              {/* LogOut trigger card */}
              <Card className="bg-card/40 border-border/40 backdrop-blur-md flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-destructive flex items-center gap-2">
                    <LogOut className="h-5 w-5" />
                    {localT.logoutTitle}
                  </CardTitle>
                  <CardDescription>{localT.logoutConfirm}</CardDescription>
                </CardHeader>
                <CardContent className="py-6 flex items-center justify-center">
                  <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                    <LogOut className="h-8 w-8" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="font-semibold">{localT.logoutTitle}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{localT.logoutTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{localT.logoutConfirm}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-border">{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            await signOut();
                            navigate({ to: "/login" });
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {localT.logoutButton}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Theme & Language Preferences Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Theme Settings card */}
              <Card className="bg-card/40 border-border/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Sun className="h-5 w-5 text-primary" />
                    {localT.themeTitle}
                  </CardTitle>
                  <CardDescription>{localT.themeDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => changeThemeMode("light")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        mode === "light"
                          ? "border-primary bg-primary/10 text-primary shadow-[0_0_12px_rgba(var(--color-primary),0.15)]"
                          : "border-border/40 bg-background/20 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <Sun className="h-6 w-6" />
                      <span className="text-xs font-semibold">{localT.themeLight}</span>
                    </button>

                    <button
                      onClick={() => changeThemeMode("dark")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        mode === "dark"
                          ? "border-primary bg-primary/10 text-primary shadow-[0_0_12px_rgba(var(--color-primary),0.15)]"
                          : "border-border/40 bg-background/20 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <Moon className="h-6 w-6" />
                      <span className="text-xs font-semibold">{localT.themeDark}</span>
                    </button>

                    <button
                      onClick={() => changeThemeMode("auto")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        mode === "auto"
                          ? "border-primary bg-primary/10 text-primary shadow-[0_0_12px_rgba(var(--color-primary),0.15)]"
                          : "border-border/40 bg-background/20 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <Globe className="h-6 w-6" />
                      <span className="text-xs font-semibold">{localT.themeAuto}</span>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Language Settings card */}
              <Card className="bg-card/40 border-border/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    {localT.langTitle}
                  </CardTitle>
                  <CardDescription>{localT.langDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => changeLanguage("it")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all h-24 ${
                        lang === "it"
                          ? "border-primary bg-primary/10 text-primary shadow-[0_0_12px_rgba(var(--color-primary),0.15)]"
                          : "border-border/40 bg-background/20 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <span className="text-lg font-bold">🇮🇹 IT</span>
                      <span className="text-xs font-medium mt-1">Italiano</span>
                    </button>

                    <button
                      onClick={() => changeLanguage("en")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all h-24 ${
                        lang === "en"
                          ? "border-primary bg-primary/10 text-primary shadow-[0_0_12px_rgba(var(--color-primary),0.15)]"
                          : "border-border/40 bg-background/20 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <span className="text-lg font-bold">🇬🇧 EN</span>
                      <span className="text-xs font-medium mt-1">English</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Settings Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-card/40 border-border/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  {localT.notifications}
                </CardTitle>
                <CardDescription>Configura le tue preferenze di notifica e promemoria giornalieri.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 divide-y divide-border/20">
                {/* General Notification Toggle */}
                <div className="flex items-center justify-between pb-4">
                  <div className="space-y-0.5 max-w-[80%]">
                    <Label className="text-sm font-semibold">{localT.notifGeneral}</Label>
                    <p className="text-xs text-muted-foreground">{localT.notifGeneralDesc}</p>
                  </div>
                  <Switch
                    checked={appSettings?.notifications_enabled ?? true}
                    onCheckedChange={(checked) => updateSettings.mutate({ notifications_enabled: checked })}
                  />
                </div>

                {/* Habit Reminder Toggle */}
                <div className="flex items-center justify-between py-4">
                  <div className="space-y-0.5 max-w-[80%]">
                    <Label className="text-sm font-semibold">{localT.notifHabits}</Label>
                    <p className="text-xs text-muted-foreground">{localT.notifHabitsDesc}</p>
                  </div>
                  <Switch
                    checked={appSettings?.habit_notifications ?? true}
                    onCheckedChange={(checked) => updateSettings.mutate({ habit_notifications: checked })}
                    disabled={!(appSettings?.notifications_enabled ?? true)}
                  />
                </div>

                {/* Evening Summary Toggle & Time input */}
                <div className="py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 max-w-[80%]">
                      <Label className="text-sm font-semibold">{localT.notifSummary}</Label>
                      <p className="text-xs text-muted-foreground">{localT.notifSummaryDesc}</p>
                    </div>
                    <Switch
                      checked={appSettings?.evening_summary ?? false}
                      onCheckedChange={(checked) => updateSettings.mutate({ evening_summary: checked })}
                      disabled={!(appSettings?.notifications_enabled ?? true)}
                    />
                  </div>

                  {(appSettings?.evening_summary && (appSettings?.notifications_enabled ?? true)) && (
                    <div className="flex items-center gap-4 pl-4 border-l border-primary/20 animate-in slide-in-from-left-4 duration-200">
                      <div className="space-y-1">
                        <Label htmlFor="evening-time-input" className="text-xs font-semibold">{localT.notifTime}</Label>
                        <Input
                          id="evening-time-input"
                          type="time"
                          value={appSettings?.evening_time || "21:00"}
                          onChange={(e) => updateSettings.mutate({ evening_time: e.target.value })}
                          className="w-32 bg-background/40"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skating Metadata CRUD Tables Tab */}
          <TabsContent value="skating" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Elementi Skating CRUD */}
              <Card className="bg-card/40 border-border/40 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-md font-bold flex items-center gap-2">
                    <Award className="h-4.5 w-4.5 text-primary" />
                    {localT.skatingElements}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Inline Add Element input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="es. Flip, Lutz"
                      value={newElementName}
                      onChange={(e) => setNewElementName(e.target.value)}
                      className="bg-background/40 text-sm h-9"
                    />
                    <Button size="sm" onClick={() => addElementMutation.mutate()} className="h-9">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* List container */}
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                    {elementsQuery.isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                    ) : (elementsQuery.data || []).length === 0 ? (
                      <p className="text-xs text-center text-muted-foreground py-4">Nessun elemento</p>
                    ) : (
                      (elementsQuery.data || []).map((el) => (
                        <div key={el.id} className="flex items-center justify-between p-2 rounded-lg bg-background/30 border border-border/20 text-sm">
                          {editingElementId === el.id ? (
                            <div className="flex items-center gap-1.5 flex-1 mr-2">
                              <Input
                                value={editingElementName}
                                onChange={(e) => setEditingElementName(e.target.value)}
                                className="h-7 text-xs bg-background"
                              />
                              <Button size="icon" className="h-7 w-7" onClick={() => updateElementMutation.mutate({ id: el.id, name: editingElementName })}>
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="font-medium flex-1 truncate">{el.name}</span>
                          )}

                          <div className="flex items-center gap-1">
                            {editingElementId !== el.id && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setEditingElementId(el.id);
                                  setEditingElementName(el.name);
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteElementMutation.mutate(el.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Luoghi Skating CRUD */}
              <Card className="bg-card/40 border-border/40 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-md font-bold flex items-center gap-2">
                    <MapPin className="h-4.5 w-4.5 text-primary" />
                    {localT.skatingLocations}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Inline Add Location input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="es. Palaghiaccio"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      className="bg-background/40 text-sm h-9"
                    />
                    <Button size="sm" onClick={() => addLocationMutation.mutate()} className="h-9">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* List container */}
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                    {locationsQuery.isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                    ) : (locationsQuery.data || []).length === 0 ? (
                      <p className="text-xs text-center text-muted-foreground py-4">Nessun luogo</p>
                    ) : (
                      (locationsQuery.data || []).map((loc) => (
                        <div key={loc.id} className="flex items-center justify-between p-2 rounded-lg bg-background/30 border border-border/20 text-sm">
                          {editingLocationId === loc.id ? (
                            <div className="flex items-center gap-1.5 flex-1 mr-2">
                              <Input
                                value={editingLocationName}
                                onChange={(e) => setEditingLocationName(e.target.value)}
                                className="h-7 text-xs bg-background"
                              />
                              <Button size="icon" className="h-7 w-7" onClick={() => updateLocationMutation.mutate({ id: loc.id, name: editingLocationName })}>
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="font-medium flex-1 truncate">{loc.name}</span>
                          )}

                          <div className="flex items-center gap-1">
                            {editingLocationId !== loc.id && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setEditingLocationId(loc.id);
                                  setEditingLocationName(loc.name);
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteLocationMutation.mutate(loc.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tipi Sessione Skating CRUD */}
              <Card className="bg-card/40 border-border/40 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-md font-bold flex items-center gap-2">
                    <ListRestart className="h-4.5 w-4.5 text-primary" />
                    {localT.skatingTypes}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Inline Add Type input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="es. Tecnica, Gara"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      className="bg-background/40 text-sm h-9"
                    />
                    <Button size="sm" onClick={() => addTypeMutation.mutate()} className="h-9">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* List container */}
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                    {typesQuery.isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                    ) : (typesQuery.data || []).length === 0 ? (
                      <p className="text-xs text-center text-muted-foreground py-4">Nessun tipo</p>
                    ) : (
                      (typesQuery.data || []).map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-background/30 border border-border/20 text-sm">
                          {editingTypeId === t.id ? (
                            <div className="flex items-center gap-1.5 flex-1 mr-2">
                              <Input
                                value={editingTypeName}
                                onChange={(e) => setEditingTypeName(e.target.value)}
                                className="h-7 text-xs bg-background"
                              />
                              <Button size="icon" className="h-7 w-7" onClick={() => updateTypeMutation.mutate({ id: t.id, name: editingTypeName })}>
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <span className="font-medium flex-1 truncate">{t.name}</span>
                          )}

                          <div className="flex items-center gap-1">
                            {editingTypeId !== t.id && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setEditingTypeId(t.id);
                                  setEditingTypeName(t.name);
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteTypeMutation.mutate(t.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* JSON Data Export / Import Tab */}
          <TabsContent value="backup" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export JSON data card */}
              <Card className="bg-card/40 border-border/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    {localT.exportTitle}
                  </CardTitle>
                  <CardDescription>{localT.exportDesc}</CardDescription>
                </CardHeader>
                <CardContent className="py-6 flex justify-center items-center">
                  <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Download className="h-10 w-10 animate-bounce" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleExport} className="font-semibold text-primary-foreground shadow-md bg-gradient-to-r from-primary to-emerald-400 border-0">
                    <Download className="mr-2 h-4 w-4" />
                    {localT.exportButton}
                  </Button>
                </CardFooter>
              </Card>

              {/* Import JSON data card */}
              <Card className="bg-card/40 border-border/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    {localT.importTitle}
                  </CardTitle>
                  <CardDescription>{localT.importDesc}</CardDescription>
                </CardHeader>
                <CardContent className="py-6 flex justify-center items-center">
                  <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400">
                    <Upload className="h-10 w-10" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-3">
                  <input
                    id="import-backup-file"
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <Button variant="outline" className="border-border font-semibold hover:bg-muted cursor-pointer" asChild>
                    <label htmlFor="import-backup-file">
                      <Upload className="mr-2 h-4 w-4" />
                      {localT.importButton}
                    </label>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger" className="space-y-6">
            <Card className="border-destructive/30 bg-destructive/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-destructive flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  {localT.dangerZoneTitle}
                </CardTitle>
                <CardDescription className="text-destructive/80">
                  {localT.dangerZoneDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-foreground">{localT.deleteDataTitle}</h3>
                    <p className="text-xs text-muted-foreground">{localT.deleteDataDesc}</p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="font-semibold shadow-[0_0_12px_rgba(239,68,68,0.2)]">
                        {localT.deleteDataButton}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border max-w-sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">{localT.doubleConfirmTitle}</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                          <p>{localT.doubleConfirmDesc}</p>
                          <p className="text-xs font-semibold bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg">
                            ⚠️ {localT.doubleConfirmPrompt}
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-2">
                        <Input
                          placeholder="ELIMINA"
                          value={confirmWipeInput}
                          onChange={(e) => setConfirmWipeInput(e.target.value)}
                          className="bg-background/40 uppercase"
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          className="border-border"
                          onClick={() => setConfirmWipeInput("")}
                        >
                          {t("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleWipeAllData}
                          disabled={confirmWipeInput !== "ELIMINA" || wipeLoading}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/95 disabled:opacity-55"
                        >
                          {wipeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Elimina Definitivamente
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
