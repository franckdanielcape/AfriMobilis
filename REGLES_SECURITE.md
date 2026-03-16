# Règles de Sécurité - AfriMobilis

> **RÈGLES OBLIGATOIRES pour tout développement sur AfriMobilis**
> 
> ⚠️ **Toute violation de ces règles peut entraîner la révocation des accès**

---

## 📜 Les 10 Commandements de la Sécurité

### 1. 🔐 **AUTENTIFICATION OBLIGATOIRE**
```typescript
// AVANT toute action sensible, VÉRIFIER l'authentification
const { data: { session } } = await supabase.auth.getSession();
if (!session) throw new Error('Non authentifié');
```
**Sanction :** Bloqué en code review

---

### 2. 🛡️ **RLS SUR TOUTES LES TABLES**
```sql
-- Chaque nouvelle table DOIT avoir RLS
ALTER TABLE nouvelle_table ENABLE ROW LEVEL SECURITY;

-- Minimum : politique pour auth.uid()
CREATE POLICY "Users own data" ON nouvelle_table
  FOR ALL USING (auth.uid() = user_id);
```
**Sanction :** Refus de déploiement

---

### 3. 🔑 **PAS DE SECRETS DANS LE CODE**
```typescript
// ❌ INTERDIT
const API_KEY = 'sk-live-1234567890abcdef';

// ✅ OBLIGATOIRE
const API_KEY = process.env.API_KEY;
```
**Sanction :** Révocation immédiate des clés + audit

---

### 4. ✅ **VALIDATION DES ENTRÉES**
```typescript
// ❌ INTERDIT - Données brutes
await supabase.from('users').insert(body);

// ✅ OBLIGATOIRE - Validation Zod
const schema = z.object({ email: z.string().email() });
const data = schema.parse(body);
await supabase.from('users').insert(data);
```
**Sanction :** Retour en développement

---

### 5. 🎭 **VÉRIFICATION DES RÔLES**
```typescript
// ❌ INTERDIT - Pas de vérification de rôle
if (user) { deleteUser(userId); }

// ✅ OBLIGATOIRE - Vérifier les permissions
if (user.role !== 'super_admin') {
  throw new Error('Accès interdit');
}
```
**Sanction :** Vulnérabilité critique

---

### 6. 📝 **LOGGING DES ACTIONS**
```typescript
// ✅ OBLIGATOIRE - Logger toutes les actions admin
await supabase.from('audit_logs').insert({
  action: 'DELETE_CHEF',
  user_id: session.user.id,
  target_id: chefId,
  timestamp: new Date().toISOString()
});
```
**Sanction :** Non conformité audit

---

### 7. 🚫 **NE JAMAIS FAIRE CONFIANCE AU CLIENT**
```typescript
// ❌ INTERDIT - ID depuis le formulaire
const userId = formData.userId;

// ✅ OBLIGATOIRE - ID depuis la session
const userId = session.user.id;
```
**Sanction :** Faille de sécurité majeure

---

### 8. 🛡️ **PROTECTION XSS**
```tsx
// ❌ INTERDIT
<div dangerouslySetInnerHTML={{ __html: user.content }} />

// ✅ OBLIGATOIRE - Échappement React
<div>{user.content}</div>

// Ou nettoyage si nécessaire
<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(user.content) 
}} />
```
**Sanction :** Vulnérabilité XSS

---

### 9. ⏱️ **RATE LIMITING**
```typescript
// ✅ OBLIGATOIRE sur les routes auth
const limiter = new RateLimiter({ 
  tokensPerInterval: 5, 
  interval: 'minute' 
});

if (!(await limiter.removeTokens(1))) {
  return res.status(429).json({ error: 'Trop de tentatives' });
}
```
**Sanction :** Risque DoS

---

### 10. 🔒 **HTTPS EN PRODUCTION**
```javascript
// ✅ OBLIGATOIRE - Redirection HTTPS
if (process.env.NODE_ENV === 'production' && !req.secure) {
  return res.redirect(301, `https://${req.headers.host}${req.url}`);
}
```
**Sanction :** Refus de mise en production

---

## 🔍 Checklist avant chaque commit

### Code
- [ ] Pas de `console.log` avec données sensibles
- [ ] Pas de `debugger` ou breakpoints oubliés
- [ ] Pas de `any` TypeScript (types explicites)
- [ ] Pas d'apostrophes non échappées en JSX

### Sécurité
- [ ] Vérification `session` dans les API routes
- [ ] RLS activé sur les nouvelles tables
- [ ] Variables d'environnement utilisées
- [ ] Validation Zod des entrées

### Performance
- [ ] Pas de requêtes N+1
- [ ] Images optimisées (next/image)
- [ ] Pas de bundle trop gros

---

## 🚨 Procédure en cas d'incident

### Niveau 1 - Suspicion
1. Ne pas paniquer
2. Documenter ce qui a été observé
3. Contacter le responsable sécurité

### Niveau 2 - Confirmation
1. Isoler la fonctionnalité concernée
2. Révoquer les sessions suspectes
3. Activer le mode maintenance si nécessaire

### Niveau 3 - Compromission
1. **IMMÉDIAT** : Couper l'accès à la base de données
2. Révoquer TOUTES les sessions
3. Forcer la réinitialisation des mots de passe
4. Auditer tous les logs
5. Notifier les utilisateurs concernés
6. Patcher et redéployer

---

## 📞 Contacts

| Rôle | Contact | Téléphone |
|------|---------|-----------|
| Responsable Sécurité | security@afrimobilis.ci | +225 07 XX XX XX |
| Équipe Dev | dev@afrimobilis.ci | +225 07 XX XX XX |
| Urgence 24/7 | urgent@afrimobilis.ci | +225 07 XX XX XX |

---

## 📚 Ressources

- [Guide de sécurité complet](./SECURITY_GUIDE.md)
- [Guide des erreurs à éviter](./apps/web/GUIDE_DES_ERREURS.md)
- [Documentation Supabase Security](https://supabase.com/docs/guides/auth/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**En signant ce document, vous vous engagez à respecter ces règles.**

*Document établi le 12 Mars 2026*  
*Version 1.0*
