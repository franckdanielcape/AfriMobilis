# 🧭 GUIDE DE NAVIGATION - AfriMobilis

> Ce document définit la structure de navigation de l'application pour éviter les incohérences.

---

## 📍 Structure des Menus par Rôle

### 👑 SUPER ADMIN

| Icône | Label | URL | Description |
|-------|-------|-----|-------------|
| 📊 | Dashboard | `/dashboard` | Vue d'ensemble globale |
| 🏛️ | Syndicats | `/dashboard/admin/syndicats` | Gestion des syndicats |
| 👥 | Utilisateurs | `/dashboard/admin/utilisateurs` | Gestion des utilisateurs |

**Navigation Admin additionnelle (sous-menu ou pages directes) :**
- `/dashboard/admin/recensement` - Recenser un véhicule
- `/dashboard/admin/chauffeurs` - Gestion chauffeurs
- `/dashboard/admin/proprietaires` - Gestion propriétaires
- `/dashboard/admin/vehicules` - Gestion véhicules
- `/dashboard/admin/conformite` - Paramétrage conformité
- `/dashboard/admin/parametrage-sanctions` - Paramétrage sanctions
- `/dashboard/admin/logs` - Logs & Audit
- `/dashboard/admin/export` - Export données

---

### 👔 CHEF DE LIGNE / ADMIN SYNDICAT

| Icône | Label | URL | Description |
|-------|-------|-----|-------------|
| 📊 | Tableau de Bord | `/dashboard/chef-ligne` | Vue d'ensemble du syndicat |
| 👮 | Agents Terrain | `/dashboard/chef-ligne?tab=agents` | Gestion des agents de contrôle |
| 👨‍✈️ | Chauffeurs | `/dashboard/chauffeurs` | **⚠️ Gestion des conducteurs** |
| 🚗 | Véhicules | `/dashboard/vehicules` | Parc véhicules |
| 💰 | Versements | `/dashboard/versements` | Suivi des versements |
| 📋 | Conformité | `/dashboard/conformite` | Documents véhicules |

**⚠️ DISTINCTION IMPORTANTE :**
- **Agents Terrain** = Contrôleurs/Inspecteurs qui vérifient les taxis sur le terrain
- **Chauffeurs** = Conducteurs de taxi

---

### 🔑 PROPRIÉTAIRE

| Icône | Label | URL | Description |
|-------|-------|-----|-------------|
| 📊 | Dashboard | `/dashboard/proprietaire` | Vue d'ensemble de sa flotte |
| 🚗 | Mes Véhicules | `/dashboard/proprietaire/vehicules` | Véhicules du propriétaire |
| 👨‍✈️ | Mes Chauffeurs | `/dashboard/proprietaire/chauffeurs` | Chauffeurs affectés |
| 💰 | Versements | `/dashboard/proprietaire/versements` | Versements reçus |
| 🔧 | Pannes | `/dashboard/proprietaire/pannes` | Suivi des pannes |

---

### 👨‍✈️ CHAUFFEUR

| Icône | Label | URL | Description |
|-------|-------|-----|-------------|
| 📊 | Dashboard | `/dashboard` (redirection) | Vue personnelle |
| 💰 | Mes Versements | `/dashboard/versements` | Ses versements |
| 🔧 | Pannes | `/dashboard/pannes` | Déclarer une panne |
| 🎫 | Tickets | `/dashboard/tickets` | Support |

---

## 🚨 RÈGLES DE NAVIGATION

### Règle #1 : Nommage explicite

**❌ INTERDIT :**
```typescript
{ label: 'Agents', href: '/dashboard/chauffeurs' }  // Confusion !
```

**✅ OBLIGATOIRE :**
```typescript
{ label: '👨‍✈️ Chauffeurs', href: '/dashboard/chauffeurs' }  // Clair !
{ label: '👮 Agents Terrain', href: '/dashboard/chef-ligne?tab=agents' }  // Distinct !
```

---

### Règle #2 : Cohérence Label ↔ URL

**❌ INTERDIT :**
```typescript
// Label "Chauffeurs" qui mène aux Agents
{ label: 'Chauffeurs', href: '/dashboard/chef-ligne?tab=agents' }
```

**✅ OBLIGATOIRE :**
```typescript
// Label correspond à la destination
{ label: 'Chauffeurs', href: '/dashboard/chauffeurs' }
{ label: 'Agents Terrain', href: '/dashboard/chef-ligne?tab=agents' }
```

---

### Règle #3 : Icônes distinctives

| Type | Icône | Code |
|------|-------|------|
| Chauffeurs | 👨‍✈️ | `👨‍✈️` |
| Agents Terrain | 👮 | `👮` |
| Propriétaires | 👤 | `👤` |
| Véhicules | 🚗 | `🚗` |
| Versements | 💰 | `💰` |
| Conformité | 📋 | `📋` |

---

### Règle #4 : Vérification avant modification

Avant d'ajouter/modifier un lien dans le menu :

1. **Vérifier que la page existe** :
   ```bash
   ls apps/web/src/app/dashboard/[chemin]/page.tsx
   ```

2. **Vérifier que le label est explicite** :
   - Poser la question : "Est-ce que quelqu'un qui ne connaît pas le projet comprend où ça mène ?"

3. **Vérifier l'icône** :
   - Est-ce qu'elle est cohérente avec le contenu ?
   - Est-ce qu'elle ne prête pas à confusion avec un autre menu ?

4. **Tester le clic** :
   - Cliquer sur le menu et vérifier qu'on arrive à la bonne page
   - Vérifier que le titre de la page correspond au menu

---

## 📁 Structure des Fichiers

```
apps/web/src/app/dashboard/
├── page.tsx                    # Dashboard générique (redirection selon rôle)
├── layout.tsx                  # Layout avec navigation
├── profil/page.tsx             # Page profil utilisateur
│
├── admin/
│   ├── page.tsx                # Dashboard Super Admin
│   ├── syndicats/page.tsx      # Gestion syndicats
│   ├── utilisateurs/page.tsx   # Gestion utilisateurs
│   ├── recensement/page.tsx    # Recensement véhicule
│   ├── chauffeurs/page.tsx     # Gestion chauffeurs (admin)
│   ├── proprietaires/page.tsx  # Gestion propriétaires
│   ├── vehicules/page.tsx      # Gestion véhicules
│   ├── conformite/page.tsx     # Paramétrage conformité
│   └── ...
│
├── chef-ligne/
│   └── page.tsx                # Dashboard Chef de Ligne (+ onglet Agents)
│
├── chauffeurs/
│   └── page.tsx                # **Gestion Chauffeurs**
│
├── vehicules/
│   └── page.tsx                # Liste véhicules
│
├── versements/
│   └── page.tsx                # Suivi versements
│
├── conformite/
│   └── page.tsx                # Documents conformité
│
└── proprietaire/
    ├── page.tsx                # Dashboard Propriétaire
    ├── vehicules/page.tsx      # Ses véhicules
    ├── chauffeurs/page.tsx     # Ses chauffeurs
    └── ...
```

---

## 🎨 Convention de nommage

### Labels de menu
- Toujours commencer par une émoji pertinente
- Utiliser des termes métier reconnus
- Éviter les abréviations

**Exemples :**
- ✅ `👨‍✈️ Chauffeurs`
- ✅ `👮 Agents Terrain`
- ✅ `💰 Versements`
- ❌ `Chauf` (trop court)
- ❌ `Agents` (ambigu)

---

## 🔍 Checklist avant commit

Avant de committer une modification de navigation :

- [ ] Le label du menu est-il explicite ?
- [ ] L'icône est-elle cohérente avec le contenu ?
- [ ] Le lien mène-t-il à la bonne page ?
- [ ] La page existe-t-elle réellement ?
- [ ] Y a-t-il une distinction claire entre concepts similaires (ex: Chauffeurs vs Agents) ?
- [ ] Le menu est-il cohérent avec le rôle de l'utilisateur ?

---

## 🐛 Erreurs passées à ne pas répéter

### Erreur : Confusion Chauffeurs / Agents Terrain

**Problème :** Le menu affichait "Chauffeurs" mais menait à la page "Agents Terrain".

**Impact :** L'utilisateur cherchait à gérer les conducteurs et tombait sur les contrôleurs.

**Solution :** 
- Créer deux entrées distinctes :
  - `👮 Agents Terrain` → `/dashboard/chef-ligne?tab=agents`
  - `👨‍✈️ Chauffeurs` → `/dashboard/chauffeurs`

---

*Dernière mise à jour : Mars 2026*  
*Responsable : Développement AfriMobilis*
