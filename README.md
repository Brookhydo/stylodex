# Pokédex à Stylos

Site perso pour répertorier une collection de stylos Legami à deux, avec grille "grisé / dégrisé".

## Configuration nécessaire avant déploiement

Dans Vercel, ajoutez ces deux variables d'environnement (visibles dans Supabase > Settings > API) :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Développement local (optionnel)

```
npm install
cp .env.local.example .env.local   # puis remplir les valeurs
npm run dev
```
