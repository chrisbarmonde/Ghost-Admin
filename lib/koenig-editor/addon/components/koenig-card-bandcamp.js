import $ from 'jquery';
import Component from '@ember/component';
import layout from '../templates/components/koenig-card-bandcamp';
import {computed} from '@ember/object';
import {utils as ghostHelperUtils} from '@tryghost/helpers';
import {isBlank} from '@ember/utils';
import {run} from '@ember/runloop';
import {set} from '@ember/object';

const {countWords, countImages} = ghostHelperUtils;

export default Component.extend({
    layout,

    // attrs
    editor: null,
    payload: null,
    isSelected: false,
    isEditing: false,
    headerOffset: 0,

    // closure actions
    selectCard() {},
    deselectCard() {},
    editCard() {},
    saveCard() {},
    deleteCard() {},
    registerComponent() {},

    counts: computed('payload.html', function () {
        return {
            wordCount: countWords(this.payload.html),
            imageCount: countImages(this.payload.html)
        };
    }),

    toolbar: computed('isEditing', function () {
        if (this.isEditing) {
            return false;
        }

        return {
            items: [{
                buttonClass: 'fw4 flex items-center white',
                icon: 'koenig/kg-heading-1',
                iconClass: 'fill-white',
                title: 'Left',
                text: '',
                action: run.bind(this, this._updatePosition, 'left')
            }, {
                buttonClass: 'fw4 flex items-center white',
                icon: 'koenig/kg-img-full',
                iconClass: 'fill-white',
                title: 'Center',
                text: '',
                action: run.bind(this, this._updatePosition, '')
            }, {
                buttonClass: 'fw4 flex items-center white',
                icon: 'koenig/kg-heading-2',
                iconClass: 'fill-white',
                title: 'Right',
                text: '',
                action: run.bind(this, this._updatePosition, 'right')
            }, {
                buttonClass: 'fw4 flex items-center white',
                icon: 'koenig/kg-edit',
                iconClass: 'fill-white',
                title: 'Edit',
                text: '',
                action: run.bind(this, this.editCard)
            }]
        };
    }),

    init() {
        this._super(...arguments);
        let payload = this.payload || {};

        // CodeMirror errors on a `null` or `undefined` value
        if (!payload.html) {
            set(payload, 'html', '');
        }

        this.set('payload', payload);

        this.registerComponent(this);
    },

    didRender() {
        this._super(...arguments);

        const $container = $(this.element).closest('.__mobiledoc-card').parent();
        const $html = $(this.element).find('.koenig-card-html-rendered').children();
        $container[0].style = $html.attr('style');
        $container.css({
            'z-index': 1,
            'min-width': 0,
            float: this.payload.position || 'none'
        });
    },

    actions: {
        updateHtml(html) {
            this._updatePayloadAttr('html', html);
        },

        leaveEditMode() {
            if (isBlank(this.payload.html)) {
                // afterRender is required to avoid double modification of `isSelected`
                // TODO: see if there's a way to avoid afterRender
                run.scheduleOnce('afterRender', this, function () {
                    this.deleteCard();
                });
            }
        }
    },

    _updatePosition(position) {
        // create undo snapshot when changing image size
        this.editor.run(() => {
            this._updatePayloadAttr('position', position);
        });
    },

    _updatePayloadAttr(attr, value) {
        let payload = this.payload;
        let save = this.saveCard;

        set(payload, attr, value);

        // update the mobiledoc and stay in edit mode
        save(payload, false);
    }
});
