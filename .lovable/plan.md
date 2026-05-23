# Piano implementazione MyHub

Lavoro molto ampio diviso in 6 fasi. Ogni fase è una migrazione DB + codice frontend, con commit logico separato.

## Fase 1 — DB & fondamenta
Nuove colonne/tabelle:
- `habits`: `frequency_days int[]`, `monthly_target int`, `deleted_at timestamptz`
- `habit_completions`: già ok
- `habits_notes_daily` (oppure usare `note` su completions — riusare campo esistente)
- `notes`: `deleted_at timestamptz`, `content_html text` (oltre al `content` markdown)
- `skating_sessions`: `rating numeric(3,1)`, `mood text`, `energy int`, `difficulty int`, `went_well text`, `worked text`, `improve text`, `next_goal text`, `location text`
- `skating_elements` (user_id, name, archived)
- `skating_session_elements` (session_id, element_name, quality)
- `skating_locations`, `skating_session_types` (gestione custom)
- `user_settings` (theme, language, notifications_enabled, habit_notif, evening_summary, evening_time, avatar_url)
- Storage bucket `avatars` pubblico

## Fase 2 — Home & Abitudini
- Saluto "Ciao, [Nome]!" in `app.index.tsx` (legge `profiles.display_name`)
- Selettore frequenza completo nel form abitudine (daily / specific_days / weekly_count / monthly_count)
- Long-press su abitudine → input nota giornaliera salvata in `habit_completions.note`, mostrata sotto il nome
- Route `app.habits.$id.tsx`: dettaglio con streak corrente/max, % completamento, heatmap mensile (grid 7×N), bar chart settimanale, pulsante Elimina con AlertDialog

## Fase 3 — Note
- Rich text editor con **TipTap** (`@tiptap/react`, starter-kit, underline, link, image, task-list, code-block, horizontal-rule) — toolbar fissa
- Inserimento immagini: upload su bucket `note-images` → insert URL
- Dialog inserimento link
- Auto-save ogni 3s con stato "Salvato ✓ / Salvataggio…"
- Sistema tag con autocomplete (lista tag esistenti) + filtro chip nella lista
- Cestino: soft-delete via `deleted_at`, vista "Cestino" con ripristina/elimina definitivo, cleanup >30gg via filtro client
- Import Notion ZIP: parser client-side con `jszip`, converte `.md`→note (tag "Notion"), `.csv`→nota tabellare

## Fase 4 — Skating
- Form sessione esteso: rating slider 1–10 step 0.5, 5 emoji mood, energia/difficoltà 1–5, 4 textarea
- Multi-select elementi tecnici con dropdown qualità per ciascuno
- Route `app.skating.stats.tsx`: tot sessioni, ore cumulative, media voto, line chart voto nel tempo, bar sessioni/mese, top elementi

## Fase 5 — Impostazioni
- Profilo: edit nome, upload avatar (bucket `avatars`), cambia password (`supabase.auth.updateUser`), logout con AlertDialog
- Aspetto: switch tema (light/dark/auto, applicato via classe su `<html>`), lingua IT/EN (i18n leggero con dictionary locale)
- Notifiche: salvate in `user_settings` (UI funzionale, persistenza)
- Dati: export JSON di tutte le tabelle utente → download; import JSON con conferma; badge online/offline (`navigator.onLine`)
- Personalizzazione Skating: CRUD su `skating_elements`, `skating_locations`, `skating_session_types`
- "Elimina tutti i dati": dialog con input "ELIMINA", elimina rows di tutte le tabelle utente

## Fase 6 — Polish & QA
- Verifica build, controllo errori console, navigazione tra le sezioni

## Dipendenze nuove
`@tiptap/react @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-link @tiptap/extension-image @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-placeholder jszip`

## Note tecniche
- Storage buckets: `avatars` (pubblico), `note-images` (pubblico)
- Tema: contesto React + `localStorage` + classe `dark`/`light` su `<html>`
- i18n: dictionary `{it,en}` + hook `useT()` semplice, niente lib esterne
- Heatmap: grid CSS, intensità colore basata su completion ratio

## Avviso
Lavoro molto vasto: lo realizzo in più turni se necessario per restare entro i limiti di output, partendo dalla Fase 1 (migrazione) e proseguendo subito con Fase 2 nello stesso turno. Confermi di procedere?
