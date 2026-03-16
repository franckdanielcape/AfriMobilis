# Guide de Sécurité - AfriMobilis

> **Document de sécurité pour protéger l'application AfriMobilis**
> 
> Version 1.0 - Mars 2026

---

## Table des matières

1. [Sécurité de l'authentification](#1-sécurité-de-lauthentification)
2. [Sécurité des données](#2-sécurité-des-données)
3. [Sécurité du code](#3-sécurité-du-code)
4. [Règles de développement sécurisé](#4-règles-de-développement-sécurisé)
5. [Checklist de déploiement](#5-checklist-de-déploiement)
6. [Procédures d'urgence](#6-procédures-durgence)

---

## 1. Sécurité de l'authentification

### 🔐 Supabase Auth - Bonnes pratiques

```typescript
// ✅ CORRECT - Vérification côté serveur
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  
  // Continuer avec la logique protégée
}

// ❌ INCORRECT - Pas de vérification
export async function POST(request: NextRequest) {
  // Accès direct sans vérification
  await supabase.from('sensitive_data').select('*');
}
```

### RLS (Row Level Security)

**Toutes les tables doivent avoir RLS activé :**

```sql
-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs ne voient que leur profil
CREATE POLICY "Users can only view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Politique : Les admins peuvent tout voir
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
```

### Gestion des rôles

| Rôle | Permissions | Niveau de risque |
|------|-------------|------------------|
| `super_admin` | Tout | 🔴 Critique |
| `super_chef_de_ligne` | Toute la ville | 🟠 Élevé |
| `chef_ligne` | Ligne/secteur | 🟡 Moyen |
| `proprietaire` | Ses véhicules | 🟢 Faible |
| `chauffeur` | Ses versements | 🟢 Faible |
| `passager` | Ses déclarations | 🟢 Faible |

---

## 2. Sécurité des données

### 🔒 Variables d'environnement

**Fichier `.env.local` (jamais committé) :**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=cle-anon-publique
SUPABASE_SERVICE_ROLE_KEY=cle-service-secrete-ne-pas-exposer

# API
JWT_SECRET=secret-jwt-complexe-min-32-caracteres
ENCRYPTION_KEY=cle-de-chiffrement-aes-256

# Autres services
REDIS_URL=redis://localhost:6379
```

**Règles :**
- ✅ Jamais de clés dans le code source
- ✅ Service role key UNIQUEMENT côté serveur (API routes)
- ✅ Anon key uniquement pour l'authentification client

### Chiffrement des données sensibles

```typescript
// ✅ CORRECT - Chiffrement des données sensibles
import { encrypt, decrypt } from '@/utils/crypto';

// Avant stockage
const encryptedPhone = encrypt(phoneNumber, process.env.ENCRYPTION_KEY);
await supabase.from('profiles').update({ phone: encryptedPhone });

// Lecture
const { data } = await supabase.from('profiles').select('phone').single();
const phone = decrypt(data.phone, process.env.ENCRYPTION_KEY);
```

### Données à ne jamais stocker en clair

- Numéros de téléphone (si usage commercial)
- Documents d'identité
- Informations bancaires
- Mots de passe (toujours hashés par Supabase Auth)

---

## 3. Sécurité du code

### Validation des entrées

```typescript
// ✅ CORRECT - Validation avec Zod
import { z } from 'zod';

const UserSchema = z.object({
  nom: z.string().min(2).max(100),
  email: z.string().email(),
  telephone: z.string().regex(/^\+225[0-9]{10}$/),
  role: z.enum(['chauffeur', 'proprietaire', 'passager'])
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const result = UserSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ 
      error: 'Données invalides',
      details: result.error.errors 
    }, { status: 400 });
  }
  
  // Données validées
  const userData = result.data;
}

// ❌ INCORRECT - Pas de validation
export async function POST(request: NextRequest) {
  const body = await request.json();
  await supabase.from('profiles').insert(body); // DANGER ! Injection possible
}
```

### Protection contre XSS

```tsx
// ✅ CORRECT - Échappement automatique par React
function DisplayUser({ user }) {
  return <div>{user.nom}</div>; // React échappe automatiquement
}

// ❌ INCORRECT - dangerouslySetInnerHTML sans nettoyage
function DisplayUser({ user }) {
  return <div dangerouslySetInnerHTML={{ __html: user.bio }} />;
}

// ✅ SI nécessaire, nettoyer avec DOMPurify
import DOMPurify from 'dompurify';

function DisplayUser({ user }) {
  const cleanBio = DOMPurify.sanitize(user.bio);
  return <div dangerouslySetInnerHTML={{ __html: cleanBio }} />;
}
```

### Protection CSRF

```typescript
// ✅ CORRECT - Tokens CSRF pour les mutations
import { createCSRFToken, verifyCSRFToken } from '@/utils/csrf';

export async function POST(request: NextRequest) {
  const csrfToken = request.headers.get('x-csrf-token');
  
  if (!verifyCSRFToken(csrfToken)) {
    return NextResponse.json({ error: 'CSRF token invalide' }, { status: 403 });
  }
  
  // Continuer...
}
```

---

## 4. Règles de développement sécurisé

### Règle #1 : Vérifier l'authentification partout

```typescript
// Dans TOUTES les API routes protégées
const { data: { session } } = await supabase.auth.getSession();
if (!session) return new Response('Non authentifié', { status: 401 });
```

### Règle #2 : Vérifier les permissions

```typescript
// Vérifier le rôle avant l'action
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', session.user.id)
  .single();

if (profile?.role !== 'super_admin') {
  return new Response('Accès interdit', { status: 403 });
}
```

### Règle #3 : Ne jamais faire confiance au client

```typescript
// ❌ Le client peut modifier n'importe quelle valeur
const userId = formData.userId; // DANGER !

// ✅ Toujours récupérer l'ID depuis la session
const userId = session.user.id; // SÉCURISÉ
```

### Règle #4 : Logger les actions sensibles

```typescript
// Dans les actions administratives
await supabase.from('audit_logs').insert({
  action: 'DELETE_USER',
  user_id: session.user.id,
  target_id: deletedUserId,
  timestamp: new Date().toISOString(),
  ip_address: request.ip
});
```

### Règle #5 : Limiter les tentatives

```typescript
// Rate limiting pour les auth
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({ tokensPerInterval: 5, interval: 'minute' });

export async function POST(request: NextRequest) {
  const remaining = await limiter.removeTokens(1);
  if (remaining < 0) {
    return NextResponse.json({ error: 'Trop de tentatives' }, { status: 429 });
  }
  // Continuer...
}
```

---

## 5. Checklist de déploiement

### Avant chaque déploiement

- [ ] **Audit de sécurité** : `npm audit`
- [ ] **Pas de secrets** dans le code
- [ ] **Variables d'environnement** configurées en production
- [ ] **RLS activé** sur toutes les tables
- [ ] **HTTPS obligatoire** en production
- [ ] **CORS configuré** correctement
- [ ] **Rate limiting** activé

### Configuration CORS (API)

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

### Headers de sécurité

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
  }
];
```

---

## 6. Procédures d'urgence

### Incident de sécurité détecté

1. **Immédiatement** : Révoquer toutes les sessions
   ```sql
   -- Supabase SQL
   SELECT auth.sign_out();
   ```

2. **Bloquer l'accès** : Désactiver les comptes compromis
   ```sql
   UPDATE auth.users 
   SET raw_app_meta_data = raw_app_meta_data || '{"banned": true}'
   WHERE id = 'user-id-compromis';
   ```

3. **Auditer** : Consulter les logs
   ```sql
   SELECT * FROM audit_logs 
   WHERE user_id = 'user-id-compromis' 
   ORDER BY timestamp DESC;
   ```

4. **Notifier** : Alerter les utilisateurs concernés

5. **Corriger** : Patcher la faille et déployer

### Contact sécurité

- Responsable sécurité : security@afrimobilis.ci
- Téléphone : +225 XX XX XX XX
- PGP Key : [lien vers clé publique]

---

## Résumé des règles critiques

| Priorité | Règle | Conséquence si ignorée |
|----------|-------|------------------------|
| 🔴 | RLS activé sur toutes les tables | Fuite de données |
| 🔴 | Vérifier auth dans toutes les API | Accès non autorisé |
| 🔴 | Pas de secrets dans le code | Compromission totale |
| 🟠 | Valider toutes les entrées | Injection SQL/NoSQL |
| 🟠 | Logger les actions admin | Non traçabilité |
| 🟡 | Rate limiting | DoS/Brute force |

---

**Dernière mise à jour :** 12 Mars 2026  
**Responsable :** Équipe Sécurité AfriMobilis
