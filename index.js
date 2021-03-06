#!/usr/bin/env node

const SS_DIR = `${process.env['HOME']}/screenshots/`;

const chokidar = require('chokidar');
const path = require('path');
const Gooi = require('gooi');
const toClipboard = require('to-clipboard');
const notifier = require('node-notifier');

const configsDir = process.env['XDG_CONFIG_HOME'] || `${process.env['HOME']}/.config/`;
const configFile = path.join(configsDir, 'gooi', 'config.json');
const config = require(configFile);

if (config.hostname == null) {
	console.error('config: hostname required');
	process.exit(1);
}
config.port = config.port || 443;
config.prefix = config.prefix || '/gooi/';

const gooi = new Gooi(config.hostname, config.port, config.prefix);

const log = (...items) => console.log(new Date().toISOString(), ...items);
const error = (...items) => console.error(new Date().toISOString(), ...items);

const sleep = time => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, time);
	});
};

chokidar.watch(SS_DIR, {
	depth: 0,
	ignoreInitial: true,
}).on('add', async file => {
	if (!/.png$/.test(file)) {
		return;
	}

	await sleep(250);

	notifier.notify('Uploading screenshot...');

	try {
		const url = await gooi.gooi([ file ]);
		const trimmed = url.trim();

		toClipboard.sync(trimmed);

		notifier.notify('Screenshot uploaded');
		log(`uploaded: ${trimmed}`);
	} catch (err) {
		notifier.notify('Error while uploading screenshot');
		error('upload error', err);
	}
});

log(`watching ${SS_DIR}`);
