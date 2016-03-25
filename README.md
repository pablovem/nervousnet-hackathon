# NervousNet Hackathon 2016

## Privacy/Accuracy Challenge
Come up with your own data summarization algorithm that guarantees the highest privacy protection level and at the same time performs accurate data analytics.

## Dev Setup

### Environment
> The following instructions are based on Mac OS X and Homebrew.

* Git (`brew install git`)
* Node.js/NPM (`brew install node`)
* Gulp (`npm install --global gulp-cli`)
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
