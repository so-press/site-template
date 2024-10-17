# Site Template

- [Dossiers](#dossiers)
- [Concepts : Les "briques"](#concepts--les-briques)
- [Outils](#outils)
  - [Responsive design](#responsive-design)
  - [Svg](#svg)
  - [Générateur](#générateur)
  - [Build](#build)
  - [Serveur local](#serveur-local)
- [Déploiement](#déploiement)
- [Installation](#installation)
- [Mise à jour](#mise-à-jour)

# Site Template

Création d'un template de site. Cet outil permet d'intégrer un design et de créer des pages, puis de les enrichir de CSS et de JS pour pouvoir ensuite les incorporer dans un site web de production.

## dossiers

Le dossier `./src` contient les fichiers utilisés pour construire le design: `.js`, `.css` ou `.scss`, `.hbs` et `.json`. Le dossier `./src/assets` contient lui les assets (svg principalement) utilisés par la tâche de build

Le dossier `./public` contient lui tous les éléments destinés à être publics sur le site de production. Avant chaque build, l'intégralité du dossier `./public` est copié dans le dossier `./dist` contenant l'application buildée

Le dossier `./src/globals/` contient tous les éléments js et (s)css non spécifiques à un composant en particulier. Il contient aussi les fichiers `head.rbs` et `foot.rbs` qui sont automatiquement ajoutés avant et après le contenu des pages lors de leur build

## Concepts : Les "briques"

Une brique peut être : Une page, un composant ou un fragment. La commande `npm run gen` permet de générer des prototypes de briques. [En savoir plus sur cette commande](#générateur)

Pages : structure HTML/CSS/JS riche qui se structure à partir de composants et de fragments, qui contient tous les éléments HTML nécéssaire pour remplir une multitude de fonctions (Exemple : Une page produit, Une page d'accueil, etc)

Composants : Structure HTML/CSS/JS qui se structure elle même à partir d'autres composants, ou de fragments, et qui permet de remplir un certains nombre de fonctions définies. (Exemple : Un menu, un Footer, Un module de sondage)

Fragments : Brique de base du design, faite de HTML/CSS/JS simple, qui ne contient pas de composants ou de fragements, et qui peut remplir un ou deux objectifs très précis. (Exemple : Un bouton, Une illsutration)

[Logique basée sur l'Atomic Design, où u site est composés d'élément de plus en plus complexes](https://atomicdesign.bradfrost.com/)

Un site est composé de pages
Une page est composée de composants et de fragments
Un composant est composé d'autres composants, mais surtout de fragments
Un fragment ne contient que du HTML standard

Les briques sont stockées dans les dossiers

```
./src/pages/
./src/components/
./src/fragments/
```

Chaque brique se compose d'un dossier dont le nom est un slug. Exemple : `./src/fragments/menu`

Dans le dossier de la brique, on retrouve au moins 3 fichiers :

- le fichier `.hbs` contient le code HTML de la brique, dans la syntaxe [Handlebars](https://handlebarsjs.com/).
- le fichier `.scss` contient le code SASS/CSS destiné à mettre en forme la brique (Il peut s'agir d'un fichier `.css` si la syntaxe SASS n'est pas nécéssaire)
- le fichier `.json` contient les meta données de la brique (nom, description, etc).

En option :

- le fichier `.js` contient le module JS dédié à la brique

Chaque brique peut être importée dans une autre via la syntax `{{>[slug de la brique]}}`

Exemple :

```
{{>menu}}
```

## Outils

### Responsive design

Le template présente 5 brealpoints identifiés par les noms tiny, small, medium, large, xlarge (Le détail est dans ./lib/breakpoints.js)

Ces breakpoints

### Svg

Les fichiers `.hbs` peuvent inclure des assets svg via la syntaxe {{svg 'slug du svg'}}. Les svg sont stockés dans ./src/asets/svg

### Générateur

On peut lancer une commande permettant de prototyper des nouvelles briques. Lancer la commande suivante et se laisser guider par les question du générateur

```
npm run gen
```

Une fois la création de la brique terminée, ses fichiers sont disponibles dans `./src/[type de brique]/[nom de la brique]. Si la brique est une page, elle sera accessible via l'uri /[slug de la brique].html

### Build

On peut lancer un build pour obtenir une version 100% HTML statique du site, avec tous les fichiers SASS compilés dans un fichier unique CSS, et un fichier JS unique reprenant tous les modules

```
npm run build
```

Les fichiers seront générés dans le dossier `./dist`

### Serveur local

On peut lancer un serveur local en utilisant la commande

```
npm run dev
```

Le serveur tourne sur localhost, avec le port défini dans le fichier .env.(valeur par défaut: 3000)

## Déploiement

Le déploiement peut se faire sur netlify, en utilisant le dossier de build `./dist` et la commande de build `npm run build`

## Installation

Sous windows, lancer la commande suivante

```
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/so-press/site-template/refs/heads/master/lib/scripts/install.bat" -OutFile "./install.bat"; Start-Process "./install.bat"
```

Sous Linux ou Mac

```
curl -s -O https://raw.githubusercontent.com/so-press/site-template/refs/heads/master/lib/scripts/install.sh && chmod +x install.sh && ./install.sh
```

## Mise à jour

Sous windows, lancer la commande suivante

```
npm run update
```

**Attention** Il est recommandé de sauver son travail et d'avoir tout commit avant de lancer un update
