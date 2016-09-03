/* global mixitup, h */

/**
 * @constructor
 * @memberof    mixitup
 * @private
 * @since       3.0.0
 */

mixitup.Control = function() {
    mixitup.Base.call(this);

    this.execAction('construct', 0);

    this.el         = null;
    this.selector   = '';
    this.bound      = [];
    this.pending    = -1;
    this.method     = '';
    this.status     = 'inactive';
    this.filter     = '';
    this.sort       = '';
    this.canDisable = false;
    this.handler    = null;

    this.execAction('construct', 1);

    h.seal(this);
};

mixitup.BaseStatic.call(mixitup.Control);

mixitup.Control.prototype = Object.create(mixitup.Base.prototype);

h.extend(mixitup.Control.prototype,
/** @lends mixitup.Control */
{
    constructor: mixitup.Control,

    /**
     * @private
     * @param {HTMLElement} el
     * @param {method}      method
     * @param {string}      selector
     */

    init: function(el, method, selector) {
        var self = this;

        self.execAction('init', 0);

        self.el         = el;
        self.method     = method;
        self.selector   = selector;

        if (self.selector) {
            self.status = 'live';
        } else {
            self.canDisable = typeof self.el.disable === 'boolean';

            switch (self.method) {
                case 'filter':
                    self.filter = self.el.getAttribute('data-filter');

                    break;
                case 'toggle':
                    self.filter = self.el.getAttribute('data-toggle');

                    break;
                case 'sort':
                    self.sort   = self.el.getAttribute('data-sort');

                    break;
                case 'multiMix':
                    self.filter = self.el.getAttribute('data-filter');
                    self.sort   = self.el.getAttribute('data-sort');

                    break;
            }
        }

        self.bindClick();

        mixitup.controls.push(self);

        self.execAction('init', 1);
    },

    /**
     * @private
     * @param  {mixitup.Mixer} mixer
     * @return {boolean}
     */

    isBound: function(mixer) {
        var self    = this,
            isBound = false;

        self.execAction('isBound', 0);

        isBound = self.bound.indexOf(mixer) > -1;

        return self.execFilter('isBound', isBound, arguments);
    },

    /**
     * @private
     * @param  {mixitup.Mixer} mixer
     * @return {void}
     */

    addBinding: function(mixer) {
        var self = this;

        self.execAction('addBinding', 0);

        if (!self.isBound()) {
            self.bound.push(mixer);
        }

        self.execAction('addBinding', 1);
    },

    /**
     * @private
     * @param  {mixitup.Mixer} mixer
     * @return {void}
     */

    removeBinding: function(mixer) {
        var self        = this,
            removeIndex = -1;

        self.execAction('removeBinding', 0);

        if ((removeIndex = self.bound.indexOf(mixer)) > -1) {
            self.bound.splice(removeIndex, 1);
        }

        if (self.bound.length < 1) {
            // No bindings exist, unbind event click handlers

            self.unbindClick();

            // Remove from `mixitup.controls` list

            removeIndex = mixitup.controls.indexOf(self);

            mixitup.controls.splice(removeIndex, 1);

            if (self.status === 'active') {
                self.setStatus('inactive');
            }
        }

        self.execAction('removeBinding', 1);
    },

    /**
     * @private
     * @return {void}
     */

    bindClick: function() {
        var self = this;

        self.execAction('bindClick', 0);

        self.handler = function(e) {
            self.handleClick(e);
        };

        h.on(self.el, 'click', self.handler);

        self.execAction('bindClick', 1);
    },

    /**
     * @private
     * @return {void}
     */

    unbindClick: function() {
        var self = this;

        self.execAction('unbindClick', 0);

        h.off(self.el, 'click', self.handler);

        self.handler = null;

        self.execAction('unbindClick', 1);
    },

    handleClick: function(e) {
        var self        = this,
            button      = null,
            mixer       = null,
            isActive    = false,
            command     = {},
            i           = -1;

        self.execAction('handleClick', 0);

        this.pending = 0;

        if (!self.selector) {
            button = self.el;
        } else {
            button = h.closestParent(e.target, self.selector, true);

            // TODO: pull attributes from element at runtime, sub with self.filter etc
        }

        switch (self.method) {
            case 'filter':
                command.filter = self.filter || button.getAttribute('data-filter');

                break;
            case 'sort':
                command.sort = self.sort || button.getAttribute('data-sort');

                break;
            case 'multiMix':
                command.filter  = self.filter || button.getAttribute('data-filter');
                command.sort    = self.sort || button.getAttribute('data-sort');

                break;
            case 'toggle':
                command.filter  = self.filter || button.getAttribute('data-toggle');

                if (self.status === 'live') {
                    // TODO: update to use new classNames config

                    isActive = h.hasClass(button, self.bound[0].controls.activeClass);
                } else {
                    isActive = self.status === 'active';
                }

                break;
        }

        command = self.execFilter('handleClick', command, arguments);

        self.pending = self.bound.length;

        for (i = 0; mixer = self.bound[i]; i++) {
            mixer._lastClicked = self.el;

            if (self.method === 'toggle') {

                isActive ? mixer.toggleOff(command.filter) : mixer.toggleOn(command.filter);
            } else {
                mixer.multiMix(command);
            }
        }

        self.execAction('handleClick', 1);
    },

    /**
     * @param   {object}          command
     * @param   {Array<string>}   toggleArray
     * @return  {void}
     */

    update: function(command, toggleArray) {
        var self    = this,
            toggle  = '',
            i       = -1;

        self.execAction('update', 0);

        self.pending--;

        self.pending = Math.max(0, self.pending);

        if (self.pending > 0) return;

        if (self.status === 'live') {
            // Control is live so has no status

            self.updateLive(command, toggleArray);

            self.execAction('update', 1);

            return;
        }

        switch (self.method) {
            case 'filter':
                if (command.filter === self.filter) {
                    self.setStatus('active');
                } else {
                    self.setStatus('inactive');
                }

                break;
            case 'multiMix':
                if (command.sort === self.sort && command.filter === self.filter) {
                    self.setStatus('active');
                } else {
                    self.setStatus('inactive');
                }

                break;
            case 'sort':
                if (command.sort === self.sort) {
                    self.setStatus('active');
                } else {
                    self.setStatus('inactive');
                }

                break;
            case 'toggle':
                if (toggleArray.length < 1) self.setStatus('inactive');

                if (command.filter === self.filter) {
                    self.setStatus('active');
                }

                for (i = 0; i < toggleArray.length; i++) {
                    toggle = toggleArray[i];

                    if (toggle === self.filter) {
                        // Button matches one active toggle

                        self.setStatus('active');

                        break;
                    }

                    self.setStatus('inactive');
                }

                break;
        }

        self.execAction('update', 1);
    },

    /**
     * @param   {string} status
     * @return  {void}
     */

    setStatus: function(status) {
        var self    = this,
            mixer   = self.bound[0];

        self.execAction('setStatus', 0);

        // TODO: currently takes the activeClass of the first bound mixer, should we check all and build up an active
        // classes list?

        if (status === self.status) return;

        switch (status) {
            case 'active':
                h.addClass(self.el, mixer.controls.activeClass);

                if (self.canDisable) self.el.disabled = false;

                break;
            case 'inactive':
                h.removeClass(self.el, mixer.controls.activeClass);

                if (self.canDisable) self.el.disabled = false;

                break;
            case 'disabled':
                if (self.canDisable) self.el.disabled = true;

                break;
        }

        self.status = status;

        self.execAction('setStatus', 1);
    },

    updateLive: function(command, toggleArray) {
        // TODO

        command, toggleArray;

        // query parent for all matching elements
        // iterate through to find those with matching values, and set to active, deactivate
        // others - try to reuse code above is poss

        // toggles -
    }
});

mixitup.controls = [];

// /**
//  * @private
//  * @instance
//  * @since 3.0.0
//  * @param   {Element}   button
//  * @return  {object|null}
//  */

// _handleMultiMixClick: function(button) {
//     var self     = this,
//         command  = null,
//         el       = null,
//         i        = -1;

//     self.execAction('_handleMultiMixClick', 0, arguments);

//     if (!h.hasClass(button, self.controls.activeClass)) {
//         for (i = 0; el = self._dom.filterButtons[i]; i++) {
//             h.removeClass(el, self.controls.activeClass);
//         }

//         for (i = 0; el = self._dom.filterToggleButtons[i]; i++) {
//             h.removeClass(el, self.controls.activeClass);
//         }

//         for (i = 0; el = self._dom.sortButtons[i]; i++) {
//             h.removeClass(el, self.controls.activeClass);
//         }

//         for (i = 0; el = self._dom.multiMixButtons[i]; i++) {
//             h.removeClass(el, self.controls.activeClass);
//         }

//         command = {
//             sort: button.getAttribute('data-sort'),
//             filter: button.getAttribute('data-filter')
//         };

//         if (self._isToggling) {
//             // If we were previously toggling, we are not now,
//             // so remove any selectors from the toggle array

//             self._isToggling            = false;
//             self._toggleArray.length    = 0;
//         }

//         // Update any matching individual filter and sort
//         // controls to reflect the multiMix

//         self._updateControls(command);
//     }

//     return self.execFilter('_handleMultiMixClick', command, arguments);
// },