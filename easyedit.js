const clicked = require('clicked');

class EasyEdit
{
    /**
     *
     * @param {HTMLElement} object
     * @param {object} options
     * @param {function} options.onedit - editing starts: callback(element, inputElement)
     * @param {function} options.onsuccess - value changed and user pressed enter: callback(value, element)
     * @param {function} options.oncancel - editing canceled with escape: callback(element)
     * @param {function} options.onchange - value was changed (but editing is not done): callback(value, element)
     */
    constructor(object, options)
    {
        this.object = object;
        this.options = options || {};
        clicked(object, this.edit.bind(this));
        this.replace = document.createElement('input');
        this.replace.style.display = 'none';
        this.replace.addEventListener('change', this.change.bind(this));
        this.replace.addEventListener('input', this.input.bind(this));
        this.replace.addEventListener('keydown', this.key.bind(this));
        this.object.insertAdjacentElement('afterend', this.replace);
    }

    edit()
    {
        this.display = this.object.style.display;
        this.replace.style.width = this.object.offsetWidth + 'px';
        this.replace.style.height = this.object.offsetHeight + 'px';
        this.replace.style.font = window.getComputedStyle(this.object, null).getPropertyValue('font');;
        this.replace.value = this.object.innerHTML;
        this.object.style.display = 'none';
        this.replace.style.display = this.display;
        this.replace.select();
        if (this.options.onedit)
        {
            this.options.onedit(this.object, this.replace);
        }
    }

    key(e)
    {
        const code = (typeof e.which === 'number') ? e.which : e.keyCode;
        if (code === 27)
        {
            this.object.style.display = this.display;
            this.replace.style.display = 'none';
            this.replace.value = this.object.innerHTML;
            if (this.options.oncancel)
            {
                this.options.oncancel(this.object, this.replace);
            }
        }
    }

    input()
    {
        if (this.options.onchange)
        {
            this.options.onchange(this.replace.value, this.object);
        }
    }

    change()
    {
        const changed = this.object.innerHTML !== this.replace.value;
        this.object.innerHTML = this.replace.value;
        this.replace.style.display = 'none';
        this.object.style.display = this.display;
        if (changed && this.options.onsuccess)
        {
            this.options.onsuccess(this.object.innerHTML, this.object);
        }
    }
}

module.exports = EasyEdit;