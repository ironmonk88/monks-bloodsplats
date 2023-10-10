import { MonksBloodsplats, log, error, i18n, setting } from "../monks-bloodsplats.js";

export class EditImages extends FormApplication {
    constructor(object, options) {
        super(object, options);

        this.imageLists = setting("image-lists");
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "bloodsplats-edit-images",
            title: i18n("MonksBloodsplats.EditImages"),
            classes: ["monks-bloodsplats-edit-images"],
            template: "./modules/monks-bloodsplats/templates/edit-images.html",
            width: 900,
            height: "auto",
            closeOnSubmit: true,
            popOut: true,
        });
    }

    getData(options) {
        let imageLists = this.imageLists;

        imageLists = Object.values(imageLists).sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        return {
            imageLists,
        };
    }

    _updateObject() {
        let data = this.imageLists.filter(c => !!c.id && !!c.name);
        game.settings.set('monks-bloodsplats', 'image-lists', data);
        MonksBloodsplats.image_list = data;
        this.submitting = true;
    }

    addList(event) {
        this.imageLists.push({ id: "", name: "" });
        this.refresh();
    }

    changeData(event) {
        let imgId = event.currentTarget.closest('li.item').dataset.id;
        let prop = $(event.currentTarget).attr("name");

        let image = this.imageLists.find(c => c.id == imgId);
        if (image) {
            let val = $(event.currentTarget).val();
            if (prop == "id") {
                val = val.replace(/[^a-z]\-/gi, '');
                $(event.currentTarget).val(val);
                if (!!this.imageLists.find(c => c.id == val)) {
                    $(event.currentTarget).val(imgId)
                    return;
                }
                $(event.currentTarget.closest('li.item')).attr("data-id", val);
            } else if(prop == "folder" || prop == "ext") {
                this.getImageCount(event.currentTarget.closest('li.item'));
            }

            image[prop] = val;
        }
    }

    removeList(event) {
        let imgId = event.currentTarget.closest('li.item').dataset.id;
        this.imageLists.findSplice(s => s.id === imgId);
        this.refresh();
    }

    resetList() {
        this.imageLists = game.settings.settings.get('monks-bloodsplats.image-lists').default;
        this.refresh();
    }

    refresh() {
        this.render(true);
        let that = this;
        window.setTimeout(function () { that.setPosition(); }, 500);
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('button[name="submit"]', html).click(this._onSubmit.bind(this));
        $('button[name="reset"]', html).click(this.resetList.bind(this));

        $('input[name]', html).change(this.changeData.bind(this));

        $('.item-delete', html).click(this.removeList.bind(this));
        $('.item-add', html).click(this.addList.bind(this));

        let that = this;
        $('input[type="color"]', html).on('change', function (event) {
            $(this).prev().val($(this).val()).change();

        });
        $('input[name="color"]', html).on('change', function (event) {
            let parent = event.currentTarget.closest('li.item');
            let id = $("input[name='id']", parent).val();
            let image = that.imageLists.find(c => c.id == id);
            image.color = $(this).val();
        });

        $('button.folder-picker', html).click(this._onPickFolder.bind(this));
    };

    _onPickFolder(event) {
        event.preventDefault();
        let parent = event.currentTarget.closest('li.item');
        let id = $("input[name='id']", parent).val();
        let image = this.imageLists.find(c => c.id == id);
        const fp = new FilePicker({
            type: "folder",
            current: this.imageLists.find(c => c.id == id).folder,
            callback: async (path) => {
                $(event.currentTarget).prev().val(path);
                image.folder = path;
                this.getImageCount(parent);
            },
            top: this.position.top + 40,
            left: this.position.left + 10
        });
        fp.browse();
    }

    async getImageCount(parent) {
        let id = $("input[name='id']", parent).val();
        let image = this.imageLists.find(c => c.id == id);
        let path = $('input[name="folder"]', parent).val() || `modules/monks-bloodsplats/images/${id}`;
        let ext = $('input[name="ext"]', parent).val() || "webp";

        let pattern = path + "/*." + ext;
        // get the list of images form the directory
        let source = "data";
        if (typeof ForgeVTT != "undefined" && ForgeVTT.usingTheForge) {
            source = "forgevtt";
        }

        // Support S3 matching
        if (/\.s3\./.test(pattern)) {
            source = "s3";
            const { bucket, keyPrefix } = FilePicker.parseS3URL(pattern);
            if (bucket) {
                browseOptions.bucket = bucket;
                pattern = keyPrefix;
            }
        }

        const browseOptions = {
            wildcard: true,
            extensions: [`.${ext}`]
        };

        let content = await FilePicker.browse(source, pattern, browseOptions);
        $('input[name="count"]', parent).val(content.files.length);
        image.count = content.files.length;
    }
}