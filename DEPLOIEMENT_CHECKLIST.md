# ✅ Checklist de Déploiement AfriMobilis

> Utiliser cette checklist pour tous les futurs déploiements

---

## Pré-déploiement (Local)

- [ ] Tests passent : `npm run test` (si disponible)
- [ ] Build local réussi : `npm run build`
- [ ] Preview fonctionne : `npm run preview`
- [ ] Pas d'erreurs ESLint : `npm run lint`
- [ ] Variables d'environnement définies dans `.env.local`

## Configuration Vercel

- [ ] Root Directory : `apps/web-vite`
- [ ] Framework Preset : `Vite` (ou auto-détecté)
- [ ] Build Command : `npm run build`
- [ ] Output Directory : `dist`
- [ ] **PAS de `vercel.json`**

## Variables d'Environnement (Vercel Dashboard)

```env
NEXT_PUBLIC_SUPABASE_URL=https://fqtzxijhqxnpwchgoshm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- [ ] Variables ajoutées dans Settings > Environment Variables
- [ ] Variables marquées comme "Production" si nécessaire

## Déploiement

- [ ] Code poussé sur `main`
- [ ] Build Vercel démarré automatiquement
- [ ] Build terminé avec succès (vert)
- [ ] URL de preview testée
- [ ] Fonctionnalités critiques testées

## Post-déploiement

- [ ] Site accessible sur l'URL de production
- [ ] Login fonctionne
- [ ] Navigation entre pages OK
- [ ] Pas d'erreurs console
- [ ] Responsive design OK (mobile/desktop)

---

## En cas de problème

### Build échoue
1. Vérifier les logs Vercel
2. Tester build localement : `npm run build`
3. Nettoyer : `rm -rf node_modules dist && npm install`
4. Re-push

### Variables d'env non chargées
1. Vérifier dans Vercel Dashboard
2. Redéployer (pas de cache)
3. Vérifier avec `console.log(import.meta.env)`

### 404 sur les routes
- Vérifier `vercel.json` n'existe PAS
- Vérifier React Router configuré correctement
- Vérifier `index.html` à la racine de `dist/`

---

*Dernière mise à jour : 18 Mars 2026 - Déploiement réussi*
