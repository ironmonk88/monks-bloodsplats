import { registerSettings } from "./settings.js";

export let debugEnabled = 0;

export let debug = (...args) => {
    if (debugEnabled > 1) console.log("DEBUG: monks-bloodsplats | ", ...args);
};
export let log = (...args) => console.log("monks-bloodsplats | ", ...args);
export let warn = (...args) => {
    if (debugEnabled > 0) console.warn("WARN: monks-bloodsplats | ", ...args);
};
export let error = (...args) => console.error("monks-bloodsplats | ", ...args);

export const setDebugLevel = (debugText) => {
    debugEnabled = { none: 0, warn: 1, debug: 2, all: 3 }[debugText] || 0;
    // 0 = none, warnings = 1, debug = 2, all = 3
    if (debugEnabled >= 3)
        CONFIG.debug.hooks = true;
};

export let i18n = key => {
    return game.i18n.localize(key);
};
export let setting = key => {
    if (MonksBloodsplats._setting.hasOwnProperty(key))
        return MonksBloodsplats._setting[key];
    else
        return game.settings.get("monks-bloodsplats", key);
};

export let patchFunc = (prop, func, type = "WRAPPER") => {
    if (game.modules.get("lib-wrapper")?.active) {
        libWrapper.register("monks-bloodsplats", prop, func, type);
    } else {
        const oldFunc = eval(prop);
        eval(`${prop} = function (event) {
            return func.call(this, oldFunc.bind(this), ...arguments);
        }`);
    }
}

export class MonksBloodsplats {
    static movingToken = false;
    static _setting = {};

    static init() {
        if (game.MonksBloodsplats == undefined)
            game.MonksBloodsplats = MonksBloodsplats;

        registerSettings();

        MonksBloodsplats.availableGlyphs = '!"#$%&\'()*+,-./01234568:;<=>?@ABDEFGHIKMNOPQRSTUVWX[\\]^_`acdfhoquvx|}~¢£¥§©ª«¬®°±¶·º¿ÀÁÂÄÅÆÈÉÊËÌÏÑÒÓÔÖØÙÚÜßàáâåæçéêëìíîïñòõ÷øùûüÿiœŸƒπ';

        MonksBloodsplats.splatfont = new FontFace('WC Rhesus A Bta', "url('modules/monks-bloodsplats/fonts/WCRhesusABta.woff2')");
        MonksBloodsplats.splatfont.load().then(() => {
            document.fonts.add(MonksBloodsplats.splatfont);
        });

        let oldTokenDrawOverlay = Token.prototype._drawOverlay;
        Token.prototype._drawOverlay = async function (src, tint) {
            if (((this.combatant && this.combatant.defeated) || this.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.specialStatusEffects.DEFEATED) || this.document.overlayEffect == CONFIG.controlIcons.defeated) && this.actor?.type !== 'character') {
                //this should be showing the bloodsplat, so don't show the skull overlay
                return;
            } else
                return oldTokenDrawOverlay.call(this, src, tint);
        }
    }

    static ready() {
        if (!setting("transfer-settings") && game.user.isGM && game.modules.get("monks-little-details")?.active) {
            MonksBloodsplats.transferSettings();
        }
    }

    static async transferSettings() {
        let setSetting = async function (name) {
            let oldChange = game.settings.settings.get(`monks-bloodsplats.${name}`).onChange;
            game.settings.settings.get(`monks-bloodsplats.${name}`).onChange = null;
            await game.settings.set("monks-bloodsplats", name, game.settings.get("monks-little-details", name));
            game.settings.settings.get(`monks-bloodsplats.${name}`).onChange = oldChange;
        }
        
        await setSetting("bloodsplat-colour");
        await setSetting("bloodsplat-size");
        await setSetting("bloodsplat-opacity");
        //await setSetting("treasure-chest");
        //await setSetting("treasure-chest-size");

        for (let scene of game.scenes) {
            for (let token of scene.tokens) {
                if (getProperty(token, "flags.monks-little-details.bloodsplat-colour")) {
                    await token.update({ "flags.monks-bloodsplats.bloodsplat-colour": getProperty(token, "flags.monks-little-details.bloodsplat-colour") });
                }
            }
        }

        for (let actor of game.actors) {
            if (getProperty(actor.prototypeToken, "flags.monks-little-details.bloodsplat-colour")) {
                await actor.prototypeToken.update({ "flags.monks-bloodsplats.bloodsplat-colour": getProperty(actor.prototypeToken, "flags.monks-little-details.bloodsplat-colour") });
            }
        }

        ui.notifications.warn("Monk's Bloodsplats has transfered over settings from Monk's Little Details, you will need to refresh your browser for some settings to take effect.", { permanent: true });

        await game.settings.set("monks-bloodsplats", "transfer-settings", true);
    }

    static isDefeated(token) {
        return (token && (token.combatant && token.combatant.defeated) || token.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.specialStatusEffects.DEFEATED) || token.document.overlayEffect == CONFIG.controlIcons.defeated);
    }
}

Hooks.once('init', MonksBloodsplats.init);
Hooks.once('ready', MonksBloodsplats.ready);

Hooks.on("renderSettingsConfig", (app, html, data) => {
    let colour = setting("bloodsplat-colour");
    $('<input>').attr('type', 'color').attr('data-edit', 'monks-bloodsplats.bloodsplat-colour').val(colour).insertAfter($('input[name="monks-bloodsplats.bloodsplat-colour"]', html).addClass('color'));

    /*
    let btn = $('<button>')
        .addClass('file-picker')
        .attr('type', 'button')
        .attr('data-type', "imagevideo")
        .attr('data-target', "img")
        .attr('title', "Browse Files")
        .attr('tabindex', "-1")
        .html('<i class="fas fa-file-import fa-fw"></i>')
        .click(function (event) {
            const fp = new FilePicker({
                type: "imagevideo",
                current: $(event.currentTarget).prev().val(),
                callback: path => {
                    $(event.currentTarget).prev().val(path);
                }
            });
            return fp.browse();
        });
    btn.clone(true).insertAfter($('input[name="monks-bloodsplats.treasure-chest"]', html).css({ 'flex-basis': 'unset', 'flex-grow': 1 }));
    */
});

Hooks.on("updateSetting", (setting, data, options, userid) => {
    if (setting.key.startsWith("monks-bloodsplats")) {
        const key = setting.key.replace("monks-bloodsplats.", "");
        if (MonksBloodsplats._setting.hasOwnProperty(key))
            MonksBloodsplats._setting[key] = data.value;
    }
});

Hooks.on("createCombatant", function (combatant, data, options) {
    //set the blood glyph if this is the GM
    if (setting('show-bloodsplat') != "false" && combatant && game.user.isGM) {
        let token = combatant.token; //canvas.tokens.placeables.find(t => { return (t.id == combatant._token.id); });
        if (token) {
            let glyph = token.getFlag('monks-bloodsplats', 'glyph');
            if (glyph == undefined) {
                glyph = MonksBloodsplats.availableGlyphs.charAt(Math.floor(Math.random() * MonksBloodsplats.availableGlyphs.length));
                token.setFlag('monks-bloodsplats', 'glyph', glyph);
            }
        }
    }
});

Hooks.on("updateCombat", async function (combat, delta) {
    let combatStarted = (combat && (delta.round === 1 && combat.turn === 0 && combat.started === true));

    //set the bloodsplat glyph when the combat starts to maintain consistency
    if (setting('show-bloodsplat') != "false" && game.user.isGM && combatStarted) {
        for (let combatant of combat.combatants) {
            let token = combatant.token; //canvas.tokens.placeables.find(t => { return t.id == combatant._token.id; });
            if (token) {
                let glyph = token.getFlag('monks-bloodsplats', 'glyph');
                if (glyph == undefined) {
                    glyph = MonksBloodsplats.availableGlyphs.charAt(Math.floor(Math.random() * MonksBloodsplats.availableGlyphs.length));
                    await token.setFlag('monks-bloodsplats', 'glyph', glyph);
                }
            }
        }
    }
});

Hooks.on("renderTokenConfig", (app, html, data) => {
    if (game.user.isGM) {
        let colour = getProperty(app.token, "flags.monks-bloodsplats.bloodsplat-colour");

        $('<div>')
            .addClass('form-group')
            .append($('<label>').html('Bloodsplat Colour'))
            .append($('<div>').addClass('form-fields')
                .append($('<input>').addClass('color').attr('type', 'text').attr('name', 'flags.monks-bloodsplats.bloodsplat-colour').val(colour))
                .append($('<input>').attr('type', 'color').attr('data-edit', 'flags.monks-bloodsplats.bloodsplat-colour').val(colour))
            )
            .insertAfter($('[name="alpha"]', html).closest('.form-group'));

        app.setPosition();
    }
});

/*
Hooks.on("updateToken", (document) => {
    let token = document.object;
    if (token) {
        //refresh the bloodsplat if there is one
        canvas.primary.removeChild(token.bloodsplat);
        delete token.bloodsplat;
    }
});*/

Hooks.on("refreshToken", (token) => {
    //find defeated state
    if (MonksBloodsplats.isDefeated(token) && token.actor?.type !== 'character') {
        token.bars.visible = false;
        for (let effect of token.effects.children) {
            effect.alpha = 0;
        }
        if (['dnd5e.LootSheetNPC5e', 'core.MerchantSheet'].includes(token.actor?.flags?.core?.sheetClass) || token.actor?.flags["item-piles"]?.data?.enabled == true) {
            //token.mesh.alpha = 0.5;
            if (token.bloodsplat) {
                token.bloodsplat.destroy();
                delete token.bloodsplat;
            }
            /*
            if (token.actor?.flags["item-piles"]?.data?.enabled !== true) {
                if (token.tresurechest == undefined) {
                    if (setting("treasure-chest") != "") {
                        loadTexture(setting("treasure-chest")).then((tex) => {
                            const chesticon = new PIXI.Sprite(tex);
                            const size = Math.min(canvas.grid.grid.w, canvas.grid.grid.h);
                            chesticon.width = chesticon.height = size * setting("treasure-chest-size");
                            chesticon.position.set((token.w - chesticon.width) / 2, (token.h - chesticon.height) / 2);
                            chesticon.alpha = 0.8;
                            token.tresurechest = chesticon;
                            token.addChild(token.tresurechest);
                        });
                    }
                } else
                    token.tresurechest.alpha = (token.hover ? 1 : 0.8);
            } else {
                if (token.tresurechest != undefined)
                    token.tresurechest.alpha = 0;
            }
            */
        } else {
            if (token.document._id != undefined) {
                if (token.bloodsplat?.transform == undefined) {
                    let animate = canvas.ready && !token._original;
                    if (token.bloodsplat)
                        token.bloodsplat.destroy();

                    let glyph = token.document.getFlag('monks-bloodsplats', 'glyph');
                    if (glyph == undefined) {
                        glyph = MonksBloodsplats.availableGlyphs.charAt(Math.floor(Math.random() * MonksBloodsplats.availableGlyphs.length));
                        if (game.user.isGM)
                            token.document.setFlag('monks-bloodsplats', 'glyph', glyph);
                    }
                    let colour = token.document.getFlag('monks-bloodsplats', 'bloodsplat-colour') || setting('bloodsplat-colour') || '0xff0000';
                    token.bloodsplat = new PIXI.Text(' ' + glyph + ' ', { fontFamily: 'WC Rhesus A Bta', fontSize: token.h * setting("bloodsplat-size"), fill: colour, align: 'center' });
                    token.bloodsplat.alpha = (animate || (token.document.hidden && !game.user.isGM) ? 0 : 0.7);
                    token.bloodsplat.blendMode = PIXI.BLEND_MODES.OVERLAY;
                    token.bloodsplat.anchor.set(0.5, 0.5);
                    token.bloodsplat.x = token.x + (token.w / 2);
                    token.bloodsplat.y = token.y + (token.h / 2);
                    token.bloodsplat.visible = token.isVisible;
                    canvas.grid.bloodsplats.addChild(token.bloodsplat);

                    //log('Font: ', token.id, (token.h * 1.5), token.bloodsplat.x, token.bloodsplat.y);

                    const iconAlpha = (game.user.isGM || (setting("show-bloodsplat") == "both" && !token.document.hidden) ? setting("bloodsplat-opacity") : 0);
                    if (animate) {
                        //animate the bloodsplat alpha to 0.7
                        //animate the icon alpha to (game.user.isGM || setting("show-bloodsplat") == "both" ? 0.2 : 0);

                        token._animateTo = iconAlpha;

                        const attributes = [
                            { parent: token.bloodsplat, attribute: 'alpha', to: 0.7 },
                            { parent: token.mesh, attribute: 'alpha', to: iconAlpha }
                        ];

                        CanvasAnimation.animate(attributes, {
                            name: "bloodsplatAnimation" + token.id,
                            context: token,
                            duration: 800
                        }).then(() => {
                            delete token._animateTo;
                        });
                    } else
                        token.mesh.alpha = iconAlpha;
                } else {
                    const iconAlpha = (game.user.isGM || (setting("show-bloodsplat") == "both" && !token.document.hidden) ? setting("bloodsplat-opacity") : 0);
                    if (token._animateTo != iconAlpha)
                        token.mesh.alpha = iconAlpha;
                    token.bloodsplat.position.set(token.x + (token.w / 2), token.y + (token.h / 2));
                    token.bloodsplat.visible = token.isVisible;
                }
                if (token.tresurechest != undefined)
                    token.tresurechest.alpha = 0;
            }
        }
    } else {
        if (token.bloodsplat) {
            token.bloodsplat.destroy();
            delete token.bloodsplat;
        }
        if (token.tresurechest) {
            token.removeChild(token.tresurechest);
            delete token.tresurechest;
        }
    }
});

Hooks.on("updateToken", function (document, data, options, userid) {
    let token = document.object;
    if (!token)
        return;

    if (token.bloodsplat && data.hidden != undefined) {
        token.bloodsplat.alpha = (token.document.hidden && !game.user.isGM ? 0 : 0.7);
    }
});

Hooks.on("destroyToken", (token) => {
    if (token.bloodsplat) {
        token.bloodsplat.destroy();
        delete token.bloodsplat;
    }
});

Hooks.on("sightRefresh", function () {
    for (let token of canvas.tokens.placeables) {
        if (token.bloodsplat)
            token.bloodsplat.visible = token.isVisible;
    }
});

Hooks.on("drawGridLayer", function (layer) {
    layer.bloodsplats = layer.addChildAt(new PIXI.Container(), layer.ldmarkers?.parent ? layer.getChildIndex(layer.ldmarkers) : layer.getChildIndex(layer.borders));
});
