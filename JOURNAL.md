# Journal de bord — Capstone AWS Well-Architected « My Music »

Ce fichier résume l'état d'avancement, les décisions prises et pourquoi, pour que n'importe quel membre du binôme (ou son assistant IA) puisse reprendre le travail sans relire tout l'historique de chat. À mettre à jour à chaque session de travail significative.

**Deadline : lundi 24 août 2026**
**Binôme :**
- Maadjou — Membre B : Application & Continuité de service (conteneurisation, microservices, stockage fichiers, CDN, tests de résilience)
- Baye Sabarane LAM — Membre A : Réseau, IAM, sécurité, RDS, observabilité, coûts

---

## ⚠️ Point d'attention important : accès GitHub

Le dépôt officiel est `github.com/Bammite/my_music`, mais **ni Maadjou ni Baye n'ont accès en écriture à ce compte `Bammite`** (compte tiers, ni l'un ni l'autre des binômes). Il n'est pour l'instant pas possible de push directement dessus.

**Solution en place :** Maadjou a forké le dépôt sur `github.com/maadjou04/my_music`, avec toute la branche `develop` à jour (historique de Baye + travail de Maadjou). C'est la référence de travail actuelle.

**Pour Baye (ou son Claude) : comment récupérer le travail de Maadjou**
```bash
# Depuis ton clone existant du dépôt Bammite/my_music
git remote add maadjou https://github.com/maadjou04/my_music.git
git fetch maadjou
git checkout develop
git merge maadjou/develop
```
Si Baye n'a pas encore de clone local, il peut directement cloner le fork de Maadjou :
```bash
git clone https://github.com/maadjou04/my_music.git
cd my_music
git checkout develop
```

**À faire dès que possible :** trouver un moyen de recontacter le titulaire du compte `Bammite`, ou migrer le dépôt de référence vers l'un des comptes du binôme (`maadjou04` semble être la meilleure option actuelle, déjà à jour). À décider en priorité, car ça bloquera la collaboration continue si ça traîne.

---

## État d'avancement par jalon

### ✅ J1 — Analyse (terminé le 16/08/2026)

**Fait par Maadjou :**
- Exécution locale de l'application validée via `docker compose up --build` (5 conteneurs : app, mysql, mail, moment, upload — tous `healthy`)
- Parcours de bout en bout testés et validés :
  - Inscription + réception d'un vrai OTP par email (SMTP Hostinger) + connexion + profil
  - Partage d'une musique (upload mp3 + pochette) + affichage
- Diagramme AS-IS produit : `docs/diagrams/AS-IS.drawio` + `docs/diagrams/AS-IS.png`
- Liste de constats par pilier WAF : `docs/constats-AS-IS.md`

**Décision importante prise pendant J1 :** Maadjou avait initialement commencé à écrire ses propres Dockerfiles/docker-compose.yml/`.env`, avant de découvrir que Baye avait déjà poussé une version plus aboutie sur la branche `develop` (commit `258a97b`, 9 août) : multi-stage build, image `node:20-bookworm-slim` (évite les soucis de compilation native de `bcrypt` sur Alpine), utilisateur applicatif non-root, `tini` comme init système, limites CPU/mémoire par service, MySQL avec un compte dédié (`my_music`) plutôt que `root`, endpoint `/healthz`, proxy `/api/moment/time-of-day` côté `app` (corrige le couplage direct navigateur→microservice `moment`).
**→ Décision : on garde la version de Baye, celle de Maadjou a été abandonnée (`git stash drop`).** Ne pas la recréer.

**Bugs / limites détectés pendant les tests (à garder en tête, pas forcément à corriger tout de suite) :**
- Le microservice `moment` classe 17h comme "matin" (logique de calcul d'heure à vérifier — bug applicatif mineur, sans impact sur l'infra)
- Le microservice `upload` (port 4002, dossier `src/service_auxiliere/upload`) existe mais n'est branché nulle part côté frontend ; le formulaire de partage passe par une route interne différente sur `app` (`/api/upload`, `src/backend/routes/upload.js` avec busboy). À trancher explicitement en J2 : soit on branche vraiment ce microservice, soit on l'assume comme mort et on documente pourquoi.

**Fichiers `.env` locaux (non commités, à recréer sur chaque machine) :**
- Racine : `DB_ROOT_PASSWORD`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `SMTP_*`, `UPLOAD_BASE_URL` (voir `.env.example` à la racine pour la liste complète des clés)
- Les identifiants SMTP réels (Hostinger) ont été communiqués par le prof et sont dans le `.env` local de Maadjou — à redemander au prof ou se les transmettre en direct entre binômes si Baye en a besoin (ne jamais les committer).

### ⏳ J2 — Conception (à venir)

Pas encore commencé. Prochaine étape : diagramme TO-BE (draw.io) + choix des services AWS par pilier, en tenant compte des constats de J1 (`docs/constats-AS-IS.md`).

Pistes déjà évoquées par Baye dans `docs/ARCHITECTURE.md` (statut : proposition non implémentée) : découplage événementiel SNS/SQS/Lambda pour `mail` (remplacer le SMTP custom par SES) et pour `upload` (upload direct S3 + fan-out SNS vers des Lambdas de traitement). `moment` jugé trop simple pour mériter du messaging asynchrone (candidat à suppression ou rapatriement dans `app`).

### ⏳ J3 à J6

Non commencés.

---

## Comment reprendre le travail (pour un nouvel arrivant ou un autre Claude)

1. Lire ce fichier en entier.
2. Lire `docs/constats-AS-IS.md` pour comprendre les limites de l'existant.
3. Lire `docs/ARCHITECTURE.md` (proposition de Baye) avant de reproposer une architecture cible from scratch.
4. Vérifier l'état du dépôt de référence actuel (voir section accès GitHub ci-dessus) avant de committer où que ce soit.
5. Ne jamais committer de fichier `.env` réel (toujours vérifier `git status` avant `git add`).

---

*Dernière mise à jour : 16/08/2026, par Maadjou, fin de J1.*
