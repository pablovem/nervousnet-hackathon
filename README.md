# NervousNet Hackathon - 2016

## Privacy/Accuracy Challenge
Come up with your own data summarization algorithm that guarantees the highest privacy protection level and at the same time performs accurate data analytics.

## Development

### Environment Setup
> The following instructions are based on Mac OS X and [Homebrew](http://brew.sh/).

Update package database (`brew update`)

* Git (`brew install git`)
* Node.js/NPM (`brew install node`)
* MongoDB (`brew install mongodb`)
* Gulp (`npm install -g gulp-cli`)
* Bower (`npm install -g bower`)

### Installation

First, clone the repo:

```
git clone https://github.com/pablovem/nervousnet-hackathon
cd nervousnet-hackathon
```

Then, install the deps:

```
npm install
bower install
```

### Running

Requires MongoDB to be running:

```
mkdir data
mongodb --dbpath ./data
```

Node Server:

```
gulp dev
```

## Production

### Environment Setup
> The following instructions are based on [inn.ac](http://inn.ac/) env with Node.js, NPM and MongoDB.

* Gulp (`npm install -g gulp-cli`)
* Bower (`npm install -g bower`)
* Forever (`npm install -g forever`)

### Installation

First, clone the repo:

```
git clone https://github.com/pablovem/nervousnet-hackathon
cd nervousnet-hackathon
```

Then, install the deps:

```
npm install
bower install
```

Almost done:

```
gulp css
```

### Running

Node Server:

```
forever start server.js
```
