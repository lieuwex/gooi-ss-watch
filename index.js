#!/usr/bin/env node

const SS_DIR = `${process.env['HOME']}/screenshots/`;

const fs = require('fs');
const path = require('path');
const Gooi = require('gooi');
const toClipboard = require('to-clipboard');
const notifier = require('node-notifier');

const configsDir = process.env['XDG_CONFIG_HOME'] || `${process.env['HOME']}/.config/`;
const configFile = path.join(configsDir, 'gooi', 'config.json');
const config = require(configFile);

if (config.url == null) {
	console.error('config: url required');
	process.exit(1);
}
config.port = config.port || 443;
config.prefix = config.prefix || '/gooi/';

const gooi = new Gooi(config.url, config.port, config.prefix);

const log = (...items) => console.log(new Date().toISOString(), ...items);
const error = (...items) => console.error(new Date().toISOString(), ...items);

fs.watch(SS_DIR, async (type, fname) => {
	if (type !== 'rename' || !/^Screenshot at.+\.png$/.test(fname)) {
		return;
	}
	const filePath = path.join(SS_DIR, fname);
	if (!fs.existsSync(filePath)) {
		return;
	}

	notifier.notify('Uploading screenshot...');

	try {
		const url = await gooi.gooi([ filePath ]);
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
