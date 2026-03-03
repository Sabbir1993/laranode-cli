#!/usr/bin/env node

/**
 * LaraNode CLI - A Laravel-Inspired Node.js Framework Installer
 */

const { program } = require('commander');
const path = require('path');
const pkg = require('../package.json');

program
    .name('laranode')
    .description('The LaraNode Framework Installer')
    .version(pkg.version, '-v, --version');

program
    .command('new <name>')
    .description('Create a new LaraNode application')
    .option('--force', 'Force install even if directory exists')
    .action((name, options) => {
        const NewCommand = require('../src/commands/NewCommand');
        const cmd = new NewCommand();
        cmd.handle(name, options);
    });

program.parse();
