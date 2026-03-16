# 📋 RÈGLES DE DÉVELOPPEMENT - AfriMobilis

> Ce document contient les règles essentielles à suivre pour maintenir la stabilité et la cohérence du projet.

---

## 🚨 RÈGLE #1 : JAMAIS DE DONNÉES UTILISATEUR HARDCODÉES

### ❌ INTERDIT

Ne JAMAIS écrire des valeurs utilisateur en dur dans le code :

```typescript
// ❌ NON - Même pour les tests !
setUser({
    prenom: 'Franck',           // ← Interdit
    nom: 'Daniel',              // ← Interdit
    role: 'super_admin',        // ← Interdit
    email: 'franck@email.com'   // ← Interdit
});

// ❌ NON - Données de démo hardcodées
const demoUser = {
    id: 'super-admin',
    prenom: 'Super',            // ← Interdit
    nom: 'Admin'                // ← Interdit
};
```

### ✅ OBLIGATOIRE

Toujours récupérer les données depuis Supabase Auth + Profiles :

```typescript
// ✅ OUI - Récupération dynamique
useEffect(() => {
    const fetchUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            router.push('/login');
            return;
        }

        // Récupérer le profil complet
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            setUser({
                id: session.user.id,
                email: session.user.email,
                role: profile.role,           // ← Depuis la BDD
                prenom: profile.prenom,       // ← Depuis la BDD
                nom: profile.nom              // ← Depuis la BDD
            });
        } else {
            // Fallback sur métadonnées auth si pas de profil
            setUser({
                id: session.user.id,
                email: session.user.email,
                role: session.user.user_metadata?.role || 'passager',
                prenom: session.user.user_metadata?.prenom || 'Utilisateur',
                nom: session.user.user_metadata?.nom || ''
            });
        }
    };

    fetchUser();
}, []);
```

---

## 🚨 RÈGLE #2 : PAS DE "SUPER ADMIN MODE" LOCALSTORAGE

### ❌ INTERDIT

```typescript
// ❌ NON - C'est une source d'incohérences
if (localStorage.getItem('superAdminSession') === 'true') {
    setUser({
        prenom: 'Franck',
        role: 'super_admin'
    });
}
```

### ✅ OBLIGATOIRE

Le Super Admin doit se connecter normalement via Supabase Auth. La vérification se fait côté serveur (login/page.tsx), pas côté client dans les pages dashboard.

---

## 🚨 RÈGLE #3 : JAMAIS D'INFORMATIONS PERSONNELLES EN DUR

### ❌ INTERDIT

Ne JAMAIS mettre d'emails, téléphones ou noms réels dans le code (même dans les placeholders ou commentaires) :

```typescript
// ❌ NON - Email personnel dans le placeholder
<Input 
    placeholder="franckdanielcape@gmail.com"  // ← INTERDIT !
/>

// ❌ NON - Téléphone personnel dans le code
const SUPER_ADMIN_PHONE = '2250708124233';  // ← INTERDIT !

// ❌ NON - Email dans le code
const SUPER_ADMIN_EMAIL = 'franckdanielcape@gmail.com';  // ← INTERDIT !

// ❌ NON - Nom dans les commentaires
// Connexion pour Franck  // ← INTERDIT !
```

### ✅ OBLIGATOIRE

```typescript
// ✅ OUI - Placeholder générique
<Input 
    placeholder="Ex: 07 XX XX XX XX"
/>

// ✅ OUI - Utiliser des variables d'environnement pour les configs
const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

// ✅ OUI - Commentaires anonymes
// Connexion Super Admin
```

### Pourquoi ?
- **Confidentialité** : Les informations personnelles ne doivent pas être exposées dans le code
- **Sécurité** : Les emails/téléphones peuvent être utilisés pour du phishing
- **RGPD** : Exposition d' données personnelles non conforme
- **Maintenance** : Si l'email change, il faut modifier le code partout

---

## 🚨 RÈGLE #4 : VÉRIFICATION UNIFIÉE DE L'UTILISATEUR

### Pattern standard à utiliser dans TOUTES les pages dashboard

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

export default function MaPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            const userData = profile ? {
                id: session.user.id,
                email: session.user.email,
                role: profile.role,
                prenom: profile.prenom,
                nom: profile.nom
            } : {
                id: session.user.id,
                email: session.user.email,
                role: session.user.user_metadata?.role || 'passager',
                prenom: session.user.user_metadata?.prenom || 'Utilisateur',
                nom: session.user.user_metadata?.nom || ''
            };

            setUser(userData);
            setLoading(false);
        };

        fetchUser();
    }, []);

    if (loading) return <div>Chargement...</div>;
    
    // ... reste du composant
}
```

---

## 🚨 RÈGLE #5 : PAS DE DONNÉES DE DÉMO EN PRODUCTION

### ❌ INTERDIT

```typescript
// ❌ NON
if (error || data.length === 0) {
    // Mode démo avec données fictives
    setVehicules([
        { id: '1', immatriculation: '1234 AB 01', statut: 'actif' },
        { id: '2', immatriculation: '5678 CD 02', statut: 'actif' }
    ]);
}
```

### ✅ OBLIGATOIRE

```typescript
// ✅ OUI - Afficher l'état réel (même vide)
if (error) {
    console.error('Erreur:', error);
    setVehicules([]);  // Tableau vide, pas de faux données
} else {
    setVehicules(data || []);
}
```

---

## 📝 CHECKLIST AVANT COMMIT

Avant chaque commit, vérifier :

- [ ] Aucun nom/prénom hardcodé (Franck, Daniel, Super, Admin...)
- [ ] Aucun rôle hardcodé (super_admin, admin...)
- [ ] **Aucun email personnel hardcodé (même dans les placeholders)**
- [ ] **Aucun téléphone personnel hardcodé**
- [ ] Tous les `setUser` utilisent des données Supabase
- [ ] Pas de `localStorage.getItem('superAdminSession')` dans les pages dashboard
- [ ] Pas de données de démo en cas d'erreur

---

## 🔍 COMMANDE DE VÉRIFICATION

Avant chaque commit, exécuter :

```bash
# Rechercher les valeurs hardcodées problématiques
grep -r "prenom: 'Franck'\|prenom: 'Super'\|role: 'super_admin'" apps/web/src/app/dashboard/

# Rechercher les références au superAdminSession
grep -r "superAdminSession" apps/web/src/app/dashboard/

# Rechercher les emails personnels (adapter selon le contexte)
grep -r "franckdanielcape@gmail.com\|2250708124233" apps/web/src/
```

Si des résultats apparaissent, les corriger avant de commiter.

---

## 🎯 CONSÉQUENCES DES ERREURS

Si ces règles ne sont pas respectées :
- **Incohérences d'affichage** : Un utilisateur voit le nom d'un autre
- **Problèmes de permissions** : Un Chef de Ligne voit des menus Super Admin
- **Failles de sécurité** : N'importe qui peut "devenir" Super Admin en modifiant le localStorage
- **Confusion utilisateur** : Impossible de savoir qui est réellement connecté
- **Violation de confidentialité** : Informations personnelles exposées publiquement

---

## 📚 EXEMPLES DE CORRECTION

### Exemple 1 : Page dashboard corrigée

**Avant (incorrect) :**
```typescript
const fetchProfile = async () => {
    if (localStorage.getItem('superAdminSession') === 'true') {
        setUser({ prenom: 'Franck', role: 'super_admin' });
        return;
    }
    // ...
};
```

**Après (correct) :**
```typescript
const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        router.push('/login');
        return;
    }
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
    setUser({
        prenom: profile?.prenom || session.user.user_metadata?.prenom,
        role: profile?.role || session.user.user_metadata?.role
    });
};
```

### Exemple 2 : Placeholder corrigé

**Avant (incorrect) :**
```typescript
<Input 
    placeholder="Ex: 07 XX XX XX XX ou franckdanielcape@gmail.com"
/>
```

**Après (correct) :**
```typescript
<Input 
    placeholder="Ex: 07 XX XX XX XX"
/>
```

---

*Dernière mise à jour : Mars 2026*  
*Responsable : Développement AfriMobilis*
