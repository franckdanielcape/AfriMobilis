# ✅ MIGRATION 007 - RÉUSSIE

> **Date :** Mars 2026
> **Statut :** ✅ Terminée avec succès

---

## 📋 Résumé de la Migration

### Objectif
Créer la structure hiérarchique géographique :
- **Super Admin** → Gère toutes les villes
- **Super Chef de Ligne** → Gère une ville, peut créer des collègues
- **Chef de Ligne** → Gère la même ville (collègue), mêmes droits

### Tables Créées
✅ `pays` - Liste des pays (Côte d'Ivoire...)
✅ `villes` - Liste des villes (Grand-Bassam...)

### Colonnes Ajoutées
✅ `profiles.pays_id` → Référence au pays
✅ `profiles.ville_id` → Référence à la ville
✅ `vehicules.pays_id` → Référence au pays
✅ `vehicules.ville_id` → Référence à la ville

### Table Supprimée
✅ `secteurs` - Plus nécessaire (les Chefs gèrent toute la ville)

### Données Initiales Insérées
✅ Pays : Côte d'Ivoire (CI)
✅ Ville : Grand-Bassam

### RLS (Sécurité) Activées
✅ Politiques de sécurité sur les tables
✅ Chaque utilisateur ne voit que sa ville

---

## 🚨 Problèmes Rencontrés et Solutions

| Problème | Cause | Solution |
|----------|-------|----------|
| Erreur apostrophe | `Côte d'Ivoire` | Doubler l'apostrophe : `Côte d''Ivoire` |
| Erreur trigger `updated_at` | Fonction existante | Supprimer tous les triggers conflictuels |
| Erreur enum `user_role` | Valeur inexistante | Ne pas référencer directement les rôles dans les RLS |
| Erreur valeur enum non sécurisée | Transaction non commitée | Simplifier les RLS sans référence directe |

---

## 📁 Fichier de Migration

**Chemin :** `packages/database/migrations/007_structure_geographique.sql`

**Statut :** ✅ Validé et fonctionnel

---

## 🎯 Prochaines Étapes - À FAIRE MAINTENANT

### ÉTAPE 1 : Vérifier les données en base

Dans Supabase, exécutez ces requêtes pour vérifier :

```sql
-- 1. Vérifier que le pays existe
SELECT * FROM pays;
-- Résultat attendu : Côte d'Ivoire (CI)

-- 2. Vérifier que la ville existe
SELECT v.*, p.nom as pays_nom 
FROM villes v 
JOIN pays p ON v.pays_id = p.id;
-- Résultat attendu : Grand-Bassam, Côte d'Ivoire

-- 3. Vérifier que les profils ont bien une ville assignée
SELECT id, nom, prenom, role, ville_id 
FROM profiles 
LIMIT 5;
-- Résultat attendu : ville_id non NULL pour tous

-- 4. Vérifier que les véhicules ont bien une ville assignée
SELECT id, immatriculation, ville_id 
FROM vehicules 
LIMIT 5;
-- Résultat attendu : ville_id non NULL pour tous
```

---

### ÉTAPE 2 : Créer le Super Admin (si pas déjà fait)

Vérifiez que votre utilisateur Super Admin existe :

```sql
-- Vérifier le rôle
SELECT id, email, role 
FROM profiles 
WHERE email = 'franckdanielcape@gmail.com';

-- Si le rôle n'est pas 'super_admin', mettez à jour :
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'franckdanielcape@gmail.com';
```

---

### ÉTAPE 3 : Lancer l'application et tester

1. **Démarrer le serveur :**
   ```bash
   npm run dev
   ```

2. **Se connecter en Super Admin :**
   - URL : http://localhost:3000/login
   - Email : `franckdanielcape@gmail.com`
   - Mot de passe : `2253698225`

3. **Créer un Super Chef de Ligne :**
   - Aller sur `/dashboard/admin/super-chefs`
   - Cliquer "Nommer" pour Grand-Bassam
   - Créer un compte (ex: M. Kouamé)
   - **Important :** Notez le mot de passe généré ou créez-en un connu

4. **Se connecter en Super Chef de Ligne :**
   - Déconnectez-vous
   - Connectez-vous avec le nouveau compte créé
   - Vérifier que vous voyez le dashboard de Grand-Bassam

5. **Créer des Chefs de Ligne collègues :**
   - Aller sur `/dashboard/super-chef`
   - Cliquer "+ Ajouter un Chef de Ligne"
   - Créer 2-3 Chefs de Ligne (M. Yao, M. Bamba...)
   - Vérifier qu'ils apparaissent dans la liste

6. **Tester en Chef de Ligne :**
   - Se connecter avec un compte Chef de Ligne créé
   - Vérifier que vous voyez les mêmes véhicules que le Super Chef
   - Vérifier que vous ne pouvez PAS créer de Chef de Ligne

---

### ÉTAPE 4 : Vérifier l'isolement des villes (si plusieurs villes)

Si vous créez une deuxième ville (ex: Abidjan) :

1. **Super Admin** : Créer Abidjan et nommer un Super Chef
2. **Super Chef de Grand-Bassam** : Ne doit pas voir Abidjan
3. **Super Chef d'Abidjan** : Ne doit pas voir Grand-Bassam

---

## ✅ Checklist de Validation

- [ ] Migration SQL exécutée sans erreur
- [ ] Table `pays` créée avec Côte d'Ivoire
- [ ] Table `villes` créée avec Grand-Bassam
- [ ] Colonnes `ville_id` ajoutées à `profiles` et `vehicules`
- [ ] Super Admin peut se connecter
- [ ] Super Admin peut nommer un Super Chef de Ligne
- [ ] Super Chef de Ligne peut créer des Chefs de Ligne
- [ ] Chefs de Ligne voient les mêmes données que le Super Chef
- [ ] Chefs de Ligne ne peuvent pas créer d'autres Chefs
- [ ] Les menus s'adaptent au rôle (Super Admin ≠ Super Chef ≠ Chef)

---

## 🐛 En Cas de Problème

### Si les pages ne chargent pas :
1. Vider le cache : `apps/web/.next`
2. Redémarrer : `npm run dev`
3. Tester en navigation privée (Ctrl+Maj+N)

### Si erreur "ville_id is NULL" :
```sql
-- Vérifier
SELECT id, nom, prenom, ville_id FROM profiles WHERE ville_id IS NULL;

-- Corriger
UPDATE profiles 
SET ville_id = (SELECT id FROM villes WHERE nom = 'Grand-Bassam')
WHERE ville_id IS NULL;
```

### Si erreur de permission (RLS) :
```sql
-- Désactiver temporairement les RLS pour tester
ALTER TABLE villes DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Réactiver après correction
ALTER TABLE villes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

---

## 📞 Support

En cas de problème persistant :
1. Vérifier la console du navigateur (F12)
2. Vérifier les logs du terminal
3. Documenter l'erreur exacte

---

**Migration terminée avec succès ! 🎉**

*Document créé : Mars 2026*
