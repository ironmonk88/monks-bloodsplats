import { MonksBloodsplats, i18n } from "./monks-bloodsplats.js";

export const registerSettings = function () {
    // Register any custom module settings here
	let modulename = "monks-bloodsplats";

	const debouncedReload = foundry.utils.debounce(function () { window.location.reload(); }, 500);
	
	let bloodsplatoptions = {
		'false': i18n("MonksBloodsplats.bloodsplatoptions.false"),
		'true': i18n("MonksBloodsplats.bloodsplatoptions.true"),
		'both': i18n("MonksBloodsplats.bloodsplatoptions.both")
	}

	game.settings.register(modulename, "show-bloodsplat", {
		name: i18n("MonksBloodsplats.show-bloodsplat.name"),
		hint: i18n("MonksBloodsplats.show-bloodsplat.hint"),
		scope: "world",
		config: true,
		default: "true",
		choices: bloodsplatoptions,
		type: String,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "bloodsplat-colour", {
		name: i18n("MonksBloodsplats.bloodsplat-colour.name"),
		scope: "world",
		config: true,
		default: '#FF0000',
		type: String,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "bloodsplat-size", {
		name: i18n("MonksBloodsplats.bloodsplat-size.name"),
		hint: i18n("MonksBloodsplats.bloodsplat-size.hint"),
		scope: "world",
		config: true,
		default: 1,
		type: Number,
		range: {
			min: 0.2,
			max: 2,
			step: 0.1
		},
	});
	game.settings.register(modulename, "bloodsplat-opacity", {
		name: i18n("MonksBloodsplats.bloodsplat-opacity.name"),
		hint: i18n("MonksBloodsplats.bloodsplat-opacity.hint"),
		scope: "world",
		config: true,
		default: 0.2,
		type: Number,
		range: {
			min: 0,
			max: 1,
			step: 0.1
		},
	});
	game.settings.register(modulename, "treasure-chest", {
		name: i18n("MonksBloodsplats.treasure-chest.name"),
		hint: i18n("MonksBloodsplats.treasure-chest.hint"),
		scope: "world",
		config: true,
		default: "icons/svg/chest.svg",
		type: String,
		//filePicker: true,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "treasure-chest-size", {
		name: i18n("MonksBloodsplats.treasure-chest-size.name"),
		hint: i18n("MonksBloodsplats.treasure-chest-size.hint"),
		scope: "world",
		config: true,
		default: 0.9,
		type: Number,
		range: {
			min: 0.2,
			max: 1,
			step: 0.1
		},
		onChange: debouncedReload
	});

	game.settings.register(modulename, "transfer-settings", {
		scope: "world",
		config: false,
		default: false,
	});
};
