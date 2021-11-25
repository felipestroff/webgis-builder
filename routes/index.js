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
        console.log(req.body)
    
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
                    console.log(`${pugFile} done > ${outputFile}`);
    
                    getApps().then(apps => {
                        console.log(apps);
                
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

const getApps = async function () {
    const appsDir = path.resolve('./') + '/apps'

    return fs.readdirSync(appsDir, function (err, files) {
        if (err) {
            console.error(err)
        }
    })
    .filter(file => {
        return fs.lstatSync(appsDir + '/' + file).isDirectory();
    });
}

module.exports = router;