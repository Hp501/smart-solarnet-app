# Smart SolarNet — Application complète

Plateforme SaaS de gestion intelligente de micro-réseaux énergétiques IoT
(Cameroun). Stack : **Next.js 15 (App Router) + TypeScript + Tailwind CSS +
Supabase (Postgres, Auth, RLS)**.

## 📁 Structure

```
smart-solarnet-app/
├── supabase/
│   └── migrations/          # Schéma complet : tables, RLS, trigger d'inscription (0001→0011)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── auth/callback/route.ts   # confirmation email / magic link
│   │   ├── dashboard/
│   │   │   ├── layout.tsx           # protège la route + sidebar/topbar
│   │   │   ├── page.tsx             # vue d'ensemble (sources, batterie, alertes)
│   │   │   ├── loads/page.tsx       # gestion des charges
│   │   │   └── monitoring/page.tsx  # télémétrie temps réel
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # redirige vers /dashboard ou /login
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                      # Button, Input, Label, Card, AlertBanner
│   │   ├── auth/                    # SignupForm, LoginForm
│   │   └── dashboard/                # Sidebar, Topbar, MetricCard
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # client navigateur (clé anon)
│   │   │   ├── server.ts            # client serveur + client admin (service_role)
│   │   │   └── middleware.ts        # rafraîchissement session + protection routes
│   │   ├── auth-errors.ts           # traduction des erreurs Supabase en français
│   │   └── utils.ts
│   ├── middleware.ts
│   └── types/database.types.ts      # types (à régénérer avec `npm run db:types`)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.mjs
└── .env.example
```

## 🚀 Démarrage rapide

### 1. Créer le projet Supabase

Sur [supabase.com](https://supabase.com), créez un nouveau projet, puis
récupérez `Project URL` et `anon public key` dans **Project Settings → API**.

### 2. Appliquer le schéma de base de données

```bash
npm install -g supabase
supabase login
supabase link --project-ref <votre-project-ref>
supabase db push
```

Ceci exécute automatiquement toutes les migrations dans `supabase/migrations/`,
y compris **le trigger d'inscription automatique** (0010) qui garantit
qu'aucun compte ne peut exister sans profil en base.

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Remplissez `.env.local` avec les valeurs de votre projet Supabase.

### 4. Installer les dépendances et lancer le serveur

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) — vous serez redirigé
vers `/login`.

### 5. Générer les types TypeScript exacts (recommandé)

Une fois le projet lié :

```bash
npm run db:types
```

Cela remplace `src/types/database.types.ts` (actuellement écrit à la main,
simplifié) par les types exacts générés depuis votre schéma réel.

## 🔐 Authentification — ce qui est déjà géré

- **Inscription** (`/signup`) : validation côté client, un seul appel
  `supabase.auth.signUp()`, messages d'erreur traduits en français
  (`src/lib/auth-errors.ts`), écran "vérifiez votre email" si la confirmation
  est activée.
- **Le profil est garanti en base dès l'inscription** grâce au trigger
  PostgreSQL `handle_new_user()` — pas de logique frontend fragile.
- **Connexion** (`/login`) : retry automatique en cas d'erreur réseau
  transitoire, redirection vers la page initialement demandée
  (`?redirectTo=`).
- **Protection des routes** : `src/middleware.ts` redirige vers `/login` tout
  accès non authentifié à `/dashboard/*`, et vers `/dashboard` si un
  utilisateur déjà connecté visite `/login` ou `/signup`.
- **RBAC** : le rôle de l'utilisateur (`client`, `technicien`, `support`,
  `admin`...) est lu depuis `public.users` et détermine les éléments visibles
  dans la sidebar (`src/components/dashboard/sidebar.tsx`).

## 🧩 Pour activer la confirmation par email

Dans le dashboard Supabase : **Authentication → Providers → Email → Confirm
email**. Le lien de confirmation pointera vers
`https://votre-domaine.com/auth/callback` — déjà géré par
`src/app/auth/callback/route.ts`.

## 📡 Intégration de ton prototype ESP32

L'app peut recevoir les données de ton ESP32-S3-DevKit-1 (INA219, DHT11,
GSM800L, LoRa SX1278) par deux chemins complémentaires, comme prévu dans le
PFE : **MQTT en priorité, REST en secours**.

### Étape 1 — Enregistrer le device et récupérer sa clé API

Une fois connecté en tant qu'admin ou propriétaire du site, appelle :

```bash
curl -X POST https://ton-app.vercel.app/api/admin/devices \
  -H "Content-Type: application/json" \
  --cookie "<cookie de session>" \
  -d '{
    "site_id": "<uuid-du-site>",
    "device_uid": "ESP32-BASTOS-001",
    "name": "Passerelle principale",
    "device_type": "esp32"
  }'
```

La réponse contient `api_key` **une seule fois** — copie-la immédiatement
dans le firmware (ex: `config.h` ou WiFiManager).

### Étape 2a — Chemin REST (secours / rattrapage LittleFS)

```
POST /api/ingest/telemetry
Headers: x-device-uid: ESP32-BASTOS-001
         x-api-key: ssn_live_xxxxxxxx
Body: { "readings": [{ "metric": "tension", "value": 231.2, "unit": "V", "source": "solaire" }], "rssi": -58 }
```

Voir `src/app/api/ingest/telemetry/route.ts` pour le format complet.
`POST /api/ingest/heartbeat` existe aussi pour un simple "je suis vivant"
sans mesure.

### Étape 2b — Chemin MQTT (principal)

Déploie le service `mqtt-bridge/` (Node autonome, voir son propre README)
à côté de ton broker Eclipse Mosquitto. Il écoute les topics
`smartsolarnet/<device_uid>/telemetry` et `.../status` (LWT), écrit dans
Supabase, et publie les commandes de relais (`.../relay/set`) quand une
charge change d'état côté dashboard.

```bash
cd mqtt-bridge
npm install
cp .env.example .env   # broker Mosquitto + clé service_role Supabase
npm start
```

### Étape 3 — Détection automatique de panne

La migration `0012_device_offline_detection.sql` ajoute une fonction
`mark_stale_devices_offline()` qui marque un device hors ligne (et crée une
alerte "panne ESP32") s'il ne donne plus signe de vie depuis 5 minutes.
Planifie-la avec `pg_cron` ou une Supabase Scheduled Edge Function — les
instructions sont dans le fichier de migration.

## ✅ Fonctionnalités livrées (navigation par rôle)

- **Navigation dynamique** : `src/components/dashboard/sidebar.tsx` filtre les
  liens selon le rôle ; `src/lib/role-context.tsx` expose le rôle courant à
  tout composant client sans re-fetch.
- **Protection par rôle en double couche** : `src/lib/supabase/middleware.ts`
  (edge, avant le rendu) + `src/app/dashboard/admin/layout.tsx` (garde-fou
  Server Component) + RLS (garde-fou base de données).
- **Dashboard par rôle**, tous branchés sur de vraies requêtes Supabase :
  `client-dashboard.tsx` (graphiques Recharts, batterie, alertes),
  `admin-dashboard.tsx` (carte Leaflet des sites, stats globales),
  `technician-dashboard.tsx` (devices assignés, RSSI, firmware),
  `support-dashboard.tsx` (conversations, tickets, alertes).
- **Gestion des charges** avec toggle ON/OFF réel (Server Action
  `toggleLoad`, écrit dans `loads` + historique `relay_states`).
- **Alertes** avec résolution en un clic.
- **Messagerie temps réel** (Supabase Realtime — voir migration 0013) avec
  liste des conversations + fenêtre de chat.
- **Administration** : liste des utilisateurs + changement de rôle
  (`RoleSelect`), protégé par la policy RLS `users_admin_full_access`.
- **Marketplace** (catalogue en lecture) et **Facturation** (abonnement +
  factures) connectés aux vraies tables.
- **Paramètres** : formulaire de profil (nom, téléphone, langue).
- **Monitoring temps réel complet** : graphique de puissance, jauge
  batterie, carte météo, et table de télémétrie qui se met à jour toute
  seule via Supabase Realtime (badge "connecté en direct" + export CSV).
- **Formulaire d'ajout de charge** (React Hook Form + Zod), avec canal
  relais optionnel pour le lier directement à l'ESP32.
- **Administration complète** : `admin/statistics` (répartition rôles,
  sites par ville, devices en ligne) et `admin/logs` (journal d'audit —
  table `logs` déjà alimentée par le trigger d'inscription et les Server
  Actions).

Le build (`npx next build`) passe sans erreur TypeScript — 21 routes
générées.

## 📦 Encore à construire

Cart/checkout marketplace, génération de factures PDF, intégration réelle
des paiements (MTN/Orange Money, carte bancaire), module IA de
recommandations, export PDF/Excel natif (l'export CSV du monitoring est
fait, PDF/Excel restent à ajouter), notifications email/SMS, PWA,
formulaire d'ajout/édition de site (actuellement le premier site doit être
créé manuellement en base ou via un script).

## 📤 Publier sur GitHub depuis VS Code

```bash
git init
git add .
git commit -m "Scaffold initial: auth, dashboard, schéma Supabase complet"
git branch -M main
git remote add origin https://github.com/<votre-utilisateur>/smart-solarnet-app.git
git push -u origin main
```

⚠️ Vérifiez que `.env.local` n'est **jamais** commité (déjà exclu par
`.gitignore`).

## 🌐 Déploiement Vercel

```bash
npm i -g vercel
vercel
```

Ajoutez les mêmes variables d'environnement que `.env.local` dans
**Vercel → Project Settings → Environment Variables**.
