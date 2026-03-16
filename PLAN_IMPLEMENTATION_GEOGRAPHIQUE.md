# 🌍 PLAN D'IMPLÉMENTATION - Hiérarchie Géographique AfriMobilis (CORRIGÉ)

> **Résumé de la demande et plan technique d'implémentation**
> 
> **⚠️ CLARIFICATION FINALE :**
> - "Ligne" = "Ville"
> - "Super Chef de Ligne" et "Chef de Ligne" gèrent TOUS la ville entière
> - La SEULE différence : seul le Super Chef peut créer/supprimer des Chefs de Ligne

---

## 📋 RÉSUMÉ DE LA DEMANDE

### Objectif
Mettre en place une **hiérarchie avec délégation par ville** :

1. **Super Admin** : Crée les villes et nomme UN Super Chef de Ligne PAR ville
2. **Super Chef de Ligne** : Gère la ville, peut créer des Chefs de Ligne (collègues)
3. **Chefs de Ligne** : Gèrent la MÊME ville que le Super Chef, mêmes droits

### Hiérarchie Finale (CORRIGÉE)

```
SUPER ADMIN (Toutes les villes)
    └── Nomme pour chaque ville :
        
        SUPER CHEF DE LIGNE - Grand-Bassam (M. Kouamé)
        │       └── Gère TOUTE Grand-Bassam
        │       └── Peut créer d'autres Chefs de Ligne
        │
        ├── CHEF DE LIGNE - Grand-Bassam (M. Yao)
        │       └── Gère TOUTE Grand-Bassam (même ville que Super Chef)
        │       └── Ne peut PAS créer d'autres Chefs
        │
        ├── CHEF DE LIGNE - Grand-Bassam (M. Bamba)
        │       └── Gère TOUTE Grand-Bassam
        │       └── Ne peut PAS créer d'autres Chefs
        │
        └── CHEF DE LIGNE - Grand-Bassam (M. Koné)
                └── Gère TOUTE Grand-Bassam
                └── Ne peut PAS créer d'autres Chefs
```

### ⚠️ Point Clé

Tous les Chefs (Super Chef + Chefs de Ligne) voient et gèrent **LES MÊMES DONNÉES** :
- Les mêmes véhicules
- Les mêmes chauffeurs  
- Les mêmes propriétaires
- Les mêmes agents terrain

**Seule différence** : Seul le Super Chef peut ajouter/supprimer des membres de l'équipe.

---

## 👤 RÔLES ET PERMISSIONS DÉTAILLÉS

### 1. SUPER_ADMIN

**Créé :** Manuellement (Franck)

**Permissions :**
- ✅ Créer des pays
- ✅ Créer des villes/lignes
- ✅ Nommer un **Super Chef de Ligne** par ville
- ✅ Configuration système globale

**Ce qu'il ne fait PAS :**
- ❌ Ne gère pas directement les Chefs de Ligne (délégué aux Super Chefs)

---

### 2. SUPER_CHEF_DE_LIGNE (1 par ville)

**Créé :** Par le Super Admin (1 par ville)

**Portée :** **La ville entière** assignée (ex: Grand-Bassam)

**Permissions :**
- ✅ **Créer** des Chefs de Ligne (collègues pour la même ville)
- ✅ **Supprimer** des Chefs de Ligne
- ✅ Voir tous les véhicules de la ville
- ✅ Voir tous les chauffeurs de la ville
- ✅ Voir tous les propriétaires de la ville
- ✅ Gérer les agents terrain
- ✅ Valider les recensements
- ✅ Toutes les fonctions de gestion

**Ce qu'il ne peut PAS faire :**
- ❌ Créer/supprimer des villes
- ❌ Modifier la configuration système

---

### 3. CHEF_DE_LIGNE (plusieurs par ville)

**Créé :** Par le Super Chef de Ligne de sa ville

**Portée :** **La ville entière** (MÊME périmètre que le Super Chef)

**Permissions :**
- ✅ Voir tous les véhicules de la ville (même que Super Chef)
- ✅ Voir tous les chauffeurs de la ville (même que Super Chef)
- ✅ Voir tous les propriétaires de la ville (même que Super Chef)
- ✅ Gérer les agents terrain (même que Super Chef)
- ✅ Valider les recensements (même que Super Chef)
- ✅ Toutes les fonctions de gestion (mêmes que Super Chef)

**Ce qu'il ne peut PAS faire :**
- ❌ **Créer** d'autres Chefs de Ligne
- ❌ **Supprimer** d'autres Chefs de Ligne

---

## 🗂️ STRUCTURE DE LA BASE DE DONNÉES

### Tables

#### 1. Table `pays`
```sql
CREATE TABLE pays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(3) UNIQUE NOT NULL,  -- CI, SN, GH...
    nom VARCHAR(100) NOT NULL,
    indicatif_telephone VARCHAR(5),
    devise VARCHAR(3) DEFAULT 'XOF',
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. Table `villes`
```sql
CREATE TABLE villes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pays_id UUID REFERENCES pays(id),
    nom VARCHAR(100) NOT NULL,          -- "Grand-Bassam"
    super_chef_ligne_id UUID REFERENCES profiles(id),
    statut VARCHAR(20) DEFAULT 'actif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**⚠️ PAS de table `secteurs` !** Les Chefs de Ligne gèrent toute la ville.

#### 3. Table `profiles`
```sql
ALTER TABLE profiles ADD COLUMN pays_id UUID REFERENCES pays(id);
ALTER TABLE profiles ADD COLUMN ville_id UUID REFERENCES villes(id);
-- PAS de secteur_id (plus nécessaire)
```

**Rôles possibles :**
- `super_admin`
- `super_chef_de_ligne` (1 par ville)
- `chef_de_ligne` (plusieurs par ville, même ville_id)
- `proprietaire`
- `chauffeur`
- `agent_terrain`

#### 4. Table `vehicules`
```sql
ALTER TABLE vehicules ADD COLUMN pays_id UUID REFERENCES pays(id);
ALTER TABLE vehicules ADD COLUMN ville_id UUID REFERENCES villes(id);
-- PAS de secteur_id
```

---

## 🔧 PLAN D'IMPLÉMENTATION

### PHASE 1 : Structure BDD (Semaine 1)

1. ✅ Créer table `pays`
2. ✅ Créer table `villes` (avec super_chef_ligne_id)
3. ❌ ~~Créer table `secteurs`~~ (SUPPRIMÉ - plus nécessaire)
4. ✅ Modifier `profiles` (ajouter pays_id, ville_id)
5. ✅ Modifier `vehicules` (ajouter pays_id, ville_id)
6. ✅ Insérer Côte d'Ivoire et Grand-Bassam

### PHASE 2 : Super Admin (Semaine 2)

1. ✅ Créer page `/dashboard/admin/villes` - Gestion des villes
2. ✅ Créer page `/dashboard/admin/super-chefs` - Nommer les Super Chefs

### PHASE 3 : Super Chef de Ligne (Semaine 3)

1. ✅ Créer page `/dashboard/super-chef` - Dashboard
2. ✅ Créer page `/dashboard/super-chef/chefs-ligne/nouveau` - Créer des Chefs de Ligne
3. ✅ Les Chefs créés ont le même `ville_id` que le Super Chef

### PHASE 4 : Chef de Ligne (Semaine 4)

1. ✅ Dashboard Chef de Ligne (même données que Super Chef)
2. ✅ Véhicules (même ville)
3. ✅ Chauffeurs (même ville)
4. ✅ Masquer le bouton "Créer Chef de Ligne"

### PHASE 5 : Tests (Semaine 5)

1. ✅ Tester : Super Admin crée Grand-Bassam + Super Chef
2. ✅ Tester : Super Chef crée 3 Chefs de Ligne
3. ✅ Vérifier : Tous voient les mêmes véhicules
4. ✅ Vérifier : Seul Super Chef peut créer des Chefs
5. ✅ Tests de sécurité (RLS)

---

## 📊 STATS

### Super Admin
- Nombre de pays
- Nombre de villes
- Nombre de Super Chefs

### Super Chef de Ligne ET Chefs de Ligne (mêmes stats)
- Total véhicules de la ville
- Total chauffeurs de la ville
- Total propriétaires de la ville
- Liste des membres de l'équipe (pour Super Chef uniquement)

---

## 🔐 RÈGLES RLS

```sql
-- Super Admin : Voir tout
CREATE POLICY "Super Admin voit tout" ON vehicules
    FOR ALL TO authenticated
    USING (get_user_role() = 'super_admin');

-- Super Chef de Ligne : Voir sa ville
CREATE POLICY "Super Chef voit sa ville" ON vehicules
    FOR ALL TO authenticated
    USING (
        get_user_role() = 'super_chef_de_ligne'
        AND ville_id = get_user_ville_id()
    );

-- Chef de Ligne : Voir sa ville (MÊME ville que Super Chef)
CREATE POLICY "Chef de Ligne voit sa ville" ON vehicules
    FOR ALL TO authenticated
    USING (
        get_user_role() = 'chef_de_ligne'
        AND ville_id = get_user_ville_id()
    );
```

---

## ✅ CHECKLIST

- [x] Tables créées (sans secteurs)
- [x] Relations établies
- [x] Super Admin peut créer des villes
- [x] Super Admin peut nommer un Super Chef par ville
- [x] Super Chef peut créer des Chefs de Ligne
- [x] Chefs de Ligne ont le même ville_id
- [x] Tous voient les mêmes données
- [x] Seul Super Chef peut créer/supprimer des Chefs

---

## 🎯 Résumé Final

| Rôle | Nombre par ville | Gère | Peut créer des Chefs |
|------|------------------|------|---------------------|
| **Super Admin** | 1 global | Toutes les villes | Super Chefs |
| **Super Chef de Ligne** | 1 par ville | La ville | Chefs de Ligne (collègues) |
| **Chef de Ligne** | Plusieurs par ville | La ville (même) | ❌ Non |

**Points clés :**
- ✅ Super Chef et Chefs gèrent LA MÊME ville
- ✅ Tous ont les mêmes droits sur les données
- ✅ Seul le Super Chef peut gérer l'équipe
- ✅ Pas de secteurs/zones dans une ville

*Document corrigé selon vos explications : Mars 2026*
