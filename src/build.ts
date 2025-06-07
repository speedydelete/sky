
import {join} from 'node:path';
import fs from 'node:fs';
import minify from '@minify-html/node';
import webpack from 'webpack';


const mode = process.argv.includes('dev') ? 'development' : 'production';

let compiler = webpack({
    mode: mode,
    entry: join(import.meta.dirname, './index.js'),
    output: {
        path: join(import.meta.dirname, '../dist'),
        filename: 'index.js',
    },
    resolve: {
        extensions: ['.js', '.csv'],
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env'],
                    targets: {
                        chrome: '56',
                        edge: '79',
                        safari: '15',
                        firefox: '54',
                        opera: '43',
                    },
                },
            }
        ],
    },
    devtool: mode === 'development' ? 'inline-source-map' : undefined,
});

compiler.run((err, stats) => {
    if (err) {
        console.error(err);
        return;
    }
    if (stats) {
        console.log(stats.toString({colors: true}));
        if (!stats.hasErrors()) {
            let html = fs.readFileSync(join(import.meta.dirname, '../src/index.html'));
            fs.writeFileSync(join(import.meta.dirname, '../dist/index.html'), minify.minify(html, {}));
        }
    }
    compiler.close(() => {});
});
