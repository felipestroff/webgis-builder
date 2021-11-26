const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pug = require('pug');
const zipper = require('zip-local');

router.get('/', (req, res) => {
    getApps().then(apps => {
        console.log(apps);
        
        res.render('index', {
            title: 'WebGIS Builder',
            apps: apps
        });
    });
});

router.route('/new-app')
    .get((req, res) => {
        res.render('new-app', { title: 'WebGIS Builder - Novo App' });
    })
    .post((req, res) => {
        const outputDir = path.resolve('./') + `/apps/${req.body.route}`;
        const outputFile = outputDir + '/index.html';
        const pugFile = path.resolve('./') + '/views/webgis/index.pug';
    
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
            fs.writeFile(outputFile, pug.renderFile(pugFile, {
                pretty: true,
                title: req.body.name
            }), (err) => {
                if (err) {
                    console.error(err);
                }
                else {
                    const date = new Date();
                    const createdDate = ((date.getDate() )) + '/' + ((date.getMonth() + 1)) + '/' + date.getFullYear(); 

                    const app = {
                        name: req.body.name,
                        route: req.body.route,
                        date: createdDate
                    };

                    writeAppConfigFile(outputDir, JSON.stringify(app, null, 4)).then(function () {
                        return getApps();
                    })
                    .then(apps => {
                        res.render('index', {
                            title: 'WebGIS Builder',
                            apps: apps
                        });
                    });
                }
            });
        }
        else {
            res.render('new-app', {
                title: 'WebGIS Builder - Novo App',
                error: `Erro ao criar diretório: ${req.body.route}`,
                msg: 'Diretório já existente.'
            });
        }
    });

router.get('/export-app', (req, res) => {
    const appName = req.query.name;
    const sourceDir = path.resolve('./') + `/apps/${appName}`;
    const outputFile = path.resolve('./') + `/zips/${appName}.zip`;

    zipper.zip(sourceDir, function(err, zipped) {
        if (err) {
            console.error(err);
            return;
        }

        // cache a copy of the zipped file on the server
        zipped.save(outputFile, function(err) {
            if (err) {
                console.error(err);
                return;
            }
            else {
                res.download(outputFile);
            }
        });
    })
});

router.get('/delete-app', (req, res) => {
    const appName = req.query.name;
    const sourceDir = path.resolve('./') + `/apps/${appName}`;

    fs.rmdir(sourceDir, { recursive: true, force: true }, () => {
        getApps().then(apps => {
            res.render('index', {
                title: 'WebGIS Builder',
                apps: apps
            });
        });
    });
});

const getApps = async () => {
    const appsDir = path.resolve('./') + '/apps'

    const apps = fs.readdirSync(appsDir, (err, files) => {
        if (err) {
            console.error(err)
        }

        return files;
    })
    .map((file) => {
        const isDir = fs.lstatSync(appsDir + '/' + file).isDirectory();

        if (isDir) {
            outputDir = path.resolve('./') + `/apps/${file}`;

            return readAppConfigFile(outputDir);
        }
    });

    return Promise.all(apps).then(data => {
        const apps = data.filter(app => app);
        return apps.map(app => {
            return JSON.parse(app);
        });
    })
}

const writeAppConfigFile = async (outputDir, data) => {
    return fs.writeFileSync(outputDir + '/config.json', data, (err) => {
        if (err) {
            console.error(err);
        }
    });
}

const readAppConfigFile = async (outputDir) => {
    return fs.readFileSync(outputDir + '/config.json', { encoding: 'utf8' }, (err) => {
        if (err) {
            console.error(err);
        }
    });
}

module.exports = router;