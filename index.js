'use strict'

class VirtualList {
    constructor(container, options) {
        this.container = container;
        this.anchor = document.createElement('div');
        this.anchor.className = 'anchor';
        this.container.appendChild(this.anchor);

        this.tick = false;

        this.items = [];
        this.buffer = [];
        this.loaded = new Map();

        this.bufferPadding = options.bufferPadding || 2;
        this.itemHeight = options.itemHeight;
        this.onCreateItem = options.onCreateItem;
        this.onLoadItem = options.onLoadItem;
        this.onUnloadItem = options.onUnloadItem;

        this.container.addEventListener('scroll', (e) => {
            if (this.tick) return;
            this.tick = true;
            requestAnimationFrame(() => this.update());
        });

        new ResizeObserver(this.resize.bind(this)).observe(this.container);
    }

    setItems(items) {
        if (items.length != this.items.length) {
            this.items = items;
            this.resize();
        } else {
            this.items = items;
        }

        this.anchor.style.transform = 'translateY(' + this.items.length * this.itemHeight + 'px)';
    }

    resize() {
        const bufferSize = Math.min(Math.ceil(this.container.clientHeight / this.itemHeight), this.items.length) + this.bufferPadding;

        if (bufferSize != this.buffer.length) {
            const y = Math.round(this.container.scrollTop / this.itemHeight) * this.itemHeight;
            const rect = this.container.getBoundingClientRect();

            // shrink
            if (bufferSize < this.buffer.length) {
                for (var i = this.buffer.length - 1; i >= 0; i--) {
                    if (this.buffer.length != bufferSize) {
                        const item = this.buffer[i];
                        if (!item.isInside(rect)) {
                            item.unload();
                            this.loaded.delete(item.y);
                            item.element.remove();
                            this.buffer.splice(this.buffer.indexOf(item), 1);
                        }
                    } else break;
                }
            }

            // grow
            if (bufferSize > this.buffer.length) {
                for (var i = 0; i < bufferSize; i++) {
                    if (!this.buffer[i]) {
                        const itemY = y + i * this.itemHeight;
                        const index = Math.round(itemY / this.itemHeight);
                        if (index >= 0 && index < this.items.length) {
                            const data = this.items[index];
                            const item = new Item(this);
                            item.load(itemY, data);
                            this.buffer.push(item);
                            this.loaded.set(itemY, true);
                        }
                    }
                }
            }

            this.update(true);
        }
    }

    update(force) {
        const y = Math.round((this.container.scrollTop) / this.itemHeight) * this.itemHeight;

        if (this.lastY != y || force) {
            const rect = this.container.getBoundingClientRect();
            const outside = [];

            // unload outside items
            for (var i = 0; i < this.buffer.length; i++) {
                const item = this.buffer[i];
                if (!item.isInside(rect)) {
                    item.unload();
                    this.loaded.delete(item.y);
                    outside.push(item);
                }
            }

            // reuse outside items to load new ones
            for (var i = 0; i < this.buffer.length; i++) {
                const itemY = y + (i - Math.floor(this.bufferPadding / 2.0)) * this.itemHeight;
                const index = Math.round(itemY / this.itemHeight);

                if (!this.loaded.has(itemY) && index >= 0 && index < this.items.length) {
                    const unused = outside.pop();
                    if (unused) {
                        unused.load(itemY, this.items[index]);
                        this.loaded.set(itemY, true);
                    }
                }
            }
        }

        this.lastY = y;
        this.tick = false;
    }
}

class Item {
    constructor(list) {
        this.list = list;
        this.element = list.onCreateItem(this);
        this.element.style.height = list.itemHeight;
        this.list.container.appendChild(this.element);
    }

    load(y, data) {
        this.y = y;
        this.data = data;
        this.element.style.transform = 'translateY(' + y + 'px)';
        if (this.list.onLoadItem) this.list.onLoadItem(this);
    }

    unload() {
        if (this.list.onUnloadItem) this.list.onUnloadItem(this);
    }

    isInside(outerRect) {
        const rect = this.element.getBoundingClientRect();
        return rect.top < outerRect.bottom && rect.bottom > outerRect.top;
    }
}
