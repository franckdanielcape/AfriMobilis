# 📖 TERMINOLOGIE - AfriMobilis

> **Document de clarification des termes métier utilisés dans le projet**

---

## 🎯 Termes Clés

### **Ligne** = **Ville**

Dans le contexte d'Afrimobilis, le terme **"ligne"** désigne une **ville entière**.

**Exemples :**
- "Ligne de Grand-Bassam" = Ville de Grand-Bassam
- "Ligne d'Abidjan" = Ville d'Abidjan

**Pourquoi ce terme ?**
Dans le jargon des syndicats de taxis, une "ligne" représente le territoire d'exploitation d'un syndicat, qui correspond généralement à une ville.

---

### **Hiérarchie Complète des Rôles**

```
SUPER ADMIN
    └── SUPER CHEF DE LIGNE (gère tous les chefs de ligne)
            ├── CHEF DE LIGNE - Grand-Bassam
            │       ├── Agents Terrain
            │       ├── Propriétaires
            │       ├── Chauffeurs
            │       └── Véhicules
            ├── CHEF DE LIGNE - Abidjan
            │       └── ...
            └── CHEF DE LIGNE - Bouaké
                    └── ...
```

---

### **Super Admin**

**Rôle :** Administrateur technique du système

**Responsabilités :**
- Créer les pays
- Créer les villes/lignes
- Créer le Super Chef de Ligne
- Configuration système (paramètres globaux)
- Accès complet en cas d'urgence

**⚠️ Ne gère pas directement les chefs de ligne (délégué au Super Chef de Ligne)**

---

### **Super Chef de Ligne** (NOUVEAU)

**Rôle :** Manager opérationnel des chefs de ligne

**Responsabilités :**
- **Créer** des Chefs de Ligne
- **Supprimer** des Chefs de Ligne
- **Modifier** les Chefs de Ligne
- Voir toutes les statistiques de toutes les lignes
- Voir la liste de tous les chefs de ligne
- Superviser l'activité globale

**Ce qu'il ne peut PAS faire :**
- Créer/supprimer des pays (Super Admin uniquement)
- Créer/supprimer des villes/lignes (Super Admin uniquement)
- Modifier la configuration système

---

### **Chef de Ligne** = **Admin de la Ville**

**Rôle :** Responsable d'une ville (ligne) spécifique

**Responsabilités :**
- Gestion de tous les véhicules de sa ville
- Gestion de tous les chauffeurs de sa ville
- Gestion des agents terrain de sa ville
- Validation des recensements
- Validation des documents (visites techniques)
- Gestion des sanctions et avertissements
- Suivi de la conformité dans sa ville

**⚠️ IMPORTANT :** Un Chef de Ligne ne voit que SA ville. Il ne voit pas les autres villes.

---

### **Agent Terrain** ≠ **Chauffeur**

| Terme | Définition | Rôle |
|-------|-----------|------|
| **Agent Terrain** | Employé du syndicat | Contrôle les véhicules sur le terrain, fait des recensements |
| **Chauffeur** | Conducteur | Pilote le taxi, paie des versements au propriétaire |

---

## 🏗️ Hiérarchie Détaillée

### Super Admin
- Crée la structure (pays, villes)
- Crée le Super Chef de Ligne
- Configuration technique

### Super Chef de Ligne
- Gère l'équipe des Chefs de Ligne
- Peut avoir plusieurs Chefs de Ligne sous sa responsabilité
- Voir les stats globales
- Peut désactiver/remplacer un Chef de Ligne

### Chef de Ligne (par ville)
- Gère son territoire (sa ligne/ville)
- Un Chef de Ligne = Une ville
- Plusieurs Chefs de Ligne possibles (un par ville)

---

## 📍 Exemple Concret - Côte d'Ivoire

**Hiérarchie opérationnelle :**

```
SUPER ADMIN (Franck)
    └── SUPER CHEF DE LIGNE (M. Kouamé - nom d'utilisateur à définir)
            ├── CHEF DE LIGNE - Grand-Bassam (M. Yao)
            │       ├── 45 véhicules
            │       ├── 12 propriétaires
            │       └── 3 agents terrain
            ├── CHEF DE LIGNE - Abidjan (M. Koné)
            │       ├── 234 véhicules
            │       └── 8 agents terrain
            └── CHEF DE LIGNE - Bouaké (M. Bamba)
                    └── ...
```

---

## 🚫 Erreurs à Éviter

### ❌ NE PAS dire :
- "Chef de Ville" (le bon terme est "Chef de Ligne")
- "Ligne = une rue" (faux, c'est une ville entière)
- "Agent = Chauffeur" (agents sont les contrôleurs, pas les conducteurs)
- "Super Chef de Ligne = Super Admin" (non, ce sont deux rôles distincts)

### ✅ DIRE :
- "Super Chef de Ligne gère les Chefs de Ligne"
- "Chef de Ligne de Grand-Bassam"
- "Ligne de Grand-Bassam = Grand-Bassam"
- "Agents terrain = contrôleurs"
- "Chauffeurs = conducteurs"

---

## 📊 Tableau Comparatif des Rôles Admin

| Fonction | Super Admin | Super Chef de Ligne | Chef de Ligne |
|----------|-------------|---------------------|---------------|
| Créer pays | ✅ | ❌ | ❌ |
| Créer villes/lignes | ✅ | ❌ | ❌ |
| Créer Super Chef de Ligne | ✅ | ❌ | ❌ |
| Créer Chef de Ligne | ❌ | ✅ | ❌ |
| Supprimer Chef de Ligne | ❌ | ✅ | ❌ |
| Voir toutes les lignes | ✅ | ✅ | ❌ |
| Gérer sa ligne | ❌ | ❌ | ✅ |
| Gérer véhicules | ❌ | ❌ | ✅ |
| Config système | ✅ | ❌ | ❌ |

---

## 📚 Références

- Cahier des charges - Section 3.1 et 3.2
- AGENTS.md - Section Hiérarchie des rôles
- PLAN_IMPLEMENTATION_GEOGRAPHIQUE.md

---

*Document mis à jour avec le rôle Super Chef de Ligne*
