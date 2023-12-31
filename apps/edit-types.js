import { MonksBloodsplats, log, error, i18n, setting } from "../monks-bloodsplats.js";

export class EditTypes extends FormApplication {
    constructor(object, options) {
        super(object, options);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "bloodsplats-edit-types",
            title: i18n("MonksBloodsplats.EditTypes"),
            classes: ["edit-types"],
            template: "./modules/monks-bloodsplats/templates/edit-types.html",
            width: 600,
            height: "auto",
            closeOnSubmit: true,
            popOut: true,
        });
    }

    getData(options) {
        let bloodOptions = setting("image-lists")
            .filter(i => i.count !== 0)
            .map(i => {
            return {
                id: i.id,
                name: i.name,
            }
        });

        // Populate choices
        let types = {};
        if (["dnd5e", "pf1", "D35E"].includes(game.system.id)) {
            for (let [k, v] of Object.entries(CONFIG[game.system.id.toUpperCase()].creatureTypes || {})) {
                types[k] = {
                    id: k,
                    label: game.i18n.localize(v),
                };
            }
        } else if (game.system.id == "pf2e") {
            for (let [k, v] of Object.entries(CONFIG.PF2E.monsterTraits || CONFIG.PF2E.creatureTraits || {})) {
                types[k] = {
                    id: k,
                    label: game.i18n.localize(v),
                };
            }
        }
        types = mergeObject(types, setting("blood-types"));
        types.default.label = "Default";
        types.default.default = true;

        let defaultType = types.default;

        types = Object.values(types).sort((a, b) => {
            if (a.label < b.label) return -1;
            if (a.label > b.label) return 1;
            return 0;
        });

        return {
            types,
            bloodOptions,
            defaultType,
        };
    }

    _updateObject(event, formData) {
        let data = expandObject(formData).types;
        // remove any entires that have a blank type and blank color, remove either blank or color if it's blank
        Object.entries(data).forEach(([k, v]) => {
            if (v.type == "" && v.color == "" && k != "default") {
                delete data[k];
            } else {
                if (v.type == "") delete data[k].type;
                if (v.color == "") delete data[k].color;
            }
        });

        // Make sure the default is set
        if (!data.default.type)
            data.default.type = "blood";
        if (!data.default.color)
            data.default.color = "#ff0000";

        game.settings.set('monks-bloodsplats', 'blood-types', data);
        MonksBloodsplats.blood_types = data;
    }

    resetBloodTypes() {
        game.settings.set('monks-bloodsplats', 'blood-types', {
            default: {
                id: "blood"
            }
        });
        this.render(true);
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('button[name="submit"]', html).click(this._onSubmit.bind(this));
        $('button[name="reset"]', html).click(this.resetBloodTypes.bind(this));
    };
}