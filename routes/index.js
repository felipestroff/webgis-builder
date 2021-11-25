const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pug = require('pug');

router.get('/', (req, res) => {
    res.render('index', { title: 'WebGIS Builder' });
});

router.get('/new-app', (req, res) => {
    res.render('new-app', { title: 'WebGIS Builder - Novo App' });
});

router.post('/new-app', (req, res) => {
    console.log(req.body)

    const outputDir = path.resolve('./') + `/apps/${req.body.route}`;
    const outputFile = outputDir + '/index.html';
    const pugFile = path.resolve('./') + '/views/index.pug';

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
        fs.writeFile(outputFile, pug.renderFile(pugFile, {
            pretty: true
        }), (err) => {
            if (err) {
                console.error(err);
            }
            else {
                console.log(`${pugFile} done > ${outputFile}`);

                res.render('index', { title: 'WebGIS Builder' });
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

module.exports = router;